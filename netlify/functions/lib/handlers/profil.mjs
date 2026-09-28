// Profil d'un membre : lecture (tous les membres connectés) et modification (le membre lui-même ou un admin)
import { getSession } from "../session.mjs";
import { lireMembres, lireProfils, ecrireProfils, lireBannis, lireContenu, estAdmin, estAdminLive, json } from "../store.mjs";

const API = "https://discord.com/api/v10";
const texte = (v, max) => String(v == null ? "" : v).trim().slice(0, max);
const lien = (v) => { const t = texte(v, 200); return /^https:\/\/[^\s"<>]+$/i.test(t) ? t : ""; };

function nettoyer(p, jeuxAutorises) {
  return {
    bio: texte(p.bio, 280),
    couleur: /^#[0-9a-f]{6}$/i.test(p.couleur) ? p.couleur : "#c69428",
    jeuxFavoris: (Array.isArray(p.jeuxFavoris) ? p.jeuxFavoris : []).map((j) => texte(j, 60)).filter((j) => jeuxAutorises.includes(j)).slice(0, 6),
    pseudos: { riot: texte(p.pseudos && p.pseudos.riot, 40), activision: texte(p.pseudos && p.pseudos.activision, 40), autre: texte(p.pseudos && p.pseudos.autre, 60) },
    reseaux: { twitch: lien(p.reseaux && p.reseaux.twitch), tiktok: lien(p.reseaux && p.reseaux.tiktok), youtube: lien(p.reseaux && p.reseaux.youtube) },
  };
}

export const handler = async (event) => {
  const session = getSession(event);
  if (!session) return json(401, { erreur: "connexion" });
  const bannis = await lireBannis(event).catch(() => ({}));
  if (bannis[session.id]) return json(403, { erreur: "banni" });

  const id = (((event.queryStringParameters || {}).id || session.id) + "").replace(/[^0-9]/g, "");
  const moi = id === session.id;

  // ----- Modification -----
  if (event.httpMethod === "POST") {
    if (!moi && !(await estAdminLive(session))) return json(403, { erreur: "admin" });
    let recu;
    try { recu = JSON.parse(event.body || "{}"); } catch { return json(400, { erreur: "format" }); }
    const profils = await lireProfils(event);
    if (recu.reinitialiser) {
      delete profils[id];
    } else {
      const contenu = await lireContenu(event);
      const jeux = [...new Set([...((contenu && contenu.jeux) || []).map((j) => j.nom), "League of Legends", "Call of Duty", "Valorant", "Among Us", "Fortnite", "Rocket League", "Minecraft", "Counter-Strike 2", "EA FC"])];
      profils[id] = { ...nettoyer(recu.profil || {}, jeux), majLe: new Date().toISOString(), majPar: moi ? "lui" : session.name };
    }
    await ecrireProfils(event, profils);
    return json(200, { ok: true });
  }

  // ----- Lecture -----
  const [membres, profils, contenu, admin] = await Promise.all([lireMembres(event), lireProfils(event), lireContenu(event), estAdmin(session)]);
  let m = membres[id];
  if (!m && moi) m = { id, nom: session.name, username: session.username, avatar: session.avatar };
  if (!m) return json(404, { erreur: "introuvable" });

  // Date d'arrivée sur le serveur (via le bot)
  let arrivee = moi ? session.joinedAt : null;
  if (!arrivee) {
    const r = await fetch(`${API}/guilds/${process.env.DISCORD_GUILD_ID}/members/${id}`, { headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` } }).catch(() => null);
    if (r && r.ok) arrivee = (await r.json()).joined_at;
  }

  const passe = (e) => new Date(e.date) < new Date() && (e.inscrits || []).some((i) => i.id === id);
  const stats = {
    tournois: ((contenu && contenu.tournois) || []).filter(passe).length,
    events: ((contenu && contenu.events) || []).filter(passe).length,
  };

  return json(200, {
    profil: { id, nom: m.nom, username: m.username, avatar: m.avatar, derniereVisite: m.derniereVisite || null, arrivee, stats, ...(profils[id] || {}) },
    moi, admin,
    banni: admin ? bannis[id] || null : undefined,
  });
};
