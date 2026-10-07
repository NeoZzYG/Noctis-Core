// Enregistrement du contenu par un admin
import { getSession } from "../session.mjs";
import { lireContenu, ecrireContenu, estAdminLive, json, VIDE } from "../store.mjs";

const texte = (v, max = 2000) => String(v == null ? "" : v).slice(0, max);
const nombre = (v) => (v === "" || v == null || isNaN(Number(v)) ? null : Number(v));
const lienSur = (v) => { const t = texte(v, 300).trim(); return /^https:\/\/[^\s"<>]+$/i.test(t) ? t : ""; };
const idSur = (v) => texte(v, 40).replace(/[^a-z0-9-]/gi, "") || Math.random().toString(36).slice(2, 10);

const NETTOYEURS = {
  events: (e) => ({ id: idSur(e.id), titre: texte(e.titre, 120), jeu: texte(e.jeu, 60), ambiance: e.ambiance === "competitif" ? "competitif" : "chill", date: texte(e.date, 40), places: nombre(e.places), description: texte(e.description, 600), image: texte(e.image, 300) }),
  tournois: (e) => ({ id: idSur(e.id), titre: texte(e.titre, 120), jeu: texte(e.jeu, 60), date: texte(e.date, 40), format: texte(e.format, 120), places: nombre(e.places), recompense: texte(e.recompense, 160), description: texte(e.description, 800), image: texte(e.image, 300) }),
  jeux: (j) => ({ id: idSur(j.id), nom: texte(j.nom, 60), sigle: texte(j.sigle, 5), couleur: /^#[0-9a-f]{6}$/i.test(j.couleur) ? j.couleur : "#c69428", detail: texte(j.detail, 160), image: texte(j.image, 300) }),
  staff: (s) => ({ id: idSur(s.id), membreId: texte(s.membreId, 25).replace(/[^0-9]/g, ""), nom: texte(s.nom, 60), role: texte(s.role, 60), couleur: /^#[0-9a-f]{6}$/i.test(s.couleur) ? s.couleur : "#c69428", avatar: texte(s.avatar, 300), avatarDiscord: texte(s.avatarDiscord, 300), username: texte(s.username, 40) }),
  produits: (p) => {
    const images = (Array.isArray(p.images) ? p.images : p.image ? [p.image] : []).map((u) => texte(u, 300)).filter(Boolean).slice(0, 8);
    return { id: idSur(p.id), nom: texte(p.nom, 80), prix: nombre(p.prix) || 0, description: texte(p.description, 1200), tailles: texte(p.tailles, 120),
      images, image: images[0] || "", lien: texte(p.lien, 300), membres: Boolean(p.membres) };
  },
  palmares: (p) => {
    const chiffres = (v) => texte(v, 25).replace(/[^0-9]/g, "");
    // anciennes lignes : on reprend la 1re équipe du classement
    const ancien = Array.isArray(p.classement) && p.classement[0] ? p.classement[0] : null;
    const joueurs = (Array.isArray(p.joueurs) ? p.joueurs : ancien ? ancien.joueurs || [] : []).slice(0, 15)
      .map((j) => ({ membreId: chiffres(j.membreId), nom: texte(j.nom, 60), avatar: texte(j.avatar, 300) })).filter((j) => j.nom);
    return { id: idSur(p.id), tournoi: texte(p.tournoi, 120), organisateur: texte(p.organisateur, 80), jeu: texte(p.jeu, 60), date: texte(p.date, 20),
      nbEquipes: nombre(p.nbEquipes), nbJoueurs: nombre(p.nbJoueurs), equipe: texte(p.equipe || (ancien && ancien.equipe), 80), place: nombre(p.place), joueurs, image: texte(p.image, 300) };
  },
  partenaires: (s) => ({ id: idSur(s.id), nom: texte(s.nom, 80), logo: texte(s.logo, 300), description: texte(s.description, 500), discord: lienSur(s.discord), site: lienSur(s.site) }),
  streamers: (s) => ({ id: idSur(s.id), nom: texte(s.nom, 60), type: s.type === "partenaire" ? "partenaire" : "noctis", plateforme: ["twitch", "youtube", "tiktok", "kick"].includes(s.plateforme) ? s.plateforme : "twitch",
    lien: lienSur(s.lien), membreId: texte(s.membreId, 25).replace(/[^0-9]/g, ""), avatar: texte(s.avatar, 300), description: texte(s.description, 200) }),
};

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { erreur: "methode" });
  const session = getSession(event);
  if (!(await estAdminLive(session))) return json(403, { erreur: "admin" });

  let recu;
  try { recu = JSON.parse(event.body || "{}").contenu || {}; } catch { return json(400, { erreur: "format" }); }

  const ancien = (await lireContenu(event)) || VIDE;
  const propre = {};
  for (const [cle, net] of Object.entries(NETTOYEURS)) {
    propre[cle] = (Array.isArray(recu[cle]) ? recu[cle] : []).slice(0, 100).map(net);
  }
  propre.reglement = (Array.isArray(recu.reglement) ? recu.reglement : []).slice(0, 30).map((r) => texte(r, 400)).filter(Boolean);

  // On garde les inscriptions déjà faites par les membres
  for (const cle of ["events", "tournois"]) {
    const avant = Object.fromEntries((ancien[cle] || []).map((e) => [e.id, e.inscrits || []]));
    propre[cle].forEach((e) => { e.inscrits = avant[e.id] || []; });
  }
  const reg = recu.reglages || {};
  propre.reglages = { boutiqueEnConstruction: Boolean(reg.boutiqueEnConstruction) };
  propre.majLe = new Date().toISOString();
  propre.majPar = session.name;

  await ecrireContenu(event, propre);
  return json(200, { ok: true, contenu: propre });
};
