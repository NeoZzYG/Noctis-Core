// Stockage du contenu du site (events, tournois, jeux, staff...) dans Netlify Blobs
import { connectLambda, getStore } from "@netlify/blobs";

const API = "https://discord.com/api/v10";

function store(event) {
  // Fonctions "modernes" : Netlify configure le stockage tout seul (lecture fiable immédiatement)
  if (event && event.blobs) connectLambda(event);
  return getStore({ name: "noctis", consistency: "strong" });
}

const VIDE = { events: [], tournois: [], jeux: [], staff: [], produits: [], palmares: [], reglement: [], reglages: { boutiqueEnConstruction: true } };

async function lireContenu(event) {
  const c = await store(event).get("contenu", { type: "json" });
  return c ? { ...VIDE, ...c } : null;
}

async function ecrireContenu(event, contenu) {
  await store(event).setJSON("contenu", contenu);
}

// Registre des membres venus sur le site : { [id]: { id, nom, username, avatar, premiereVisite, derniereVisite } }
async function lireMembres(event) {
  return (await store(event).get("membres", { type: "json" })) || {};
}
// Note le passage d'un membre (au plus une écriture par minute et par membre)
async function noterVisite(event, session) {
  const membres = await lireMembres(event);
  const m = membres[session.id], now = new Date().toISOString();
  if (m && Date.now() - new Date(m.derniereVisite).getTime() < 60000 && m.nom === session.name && m.avatar === session.avatar) return;
  membres[session.id] = { id: session.id, nom: session.name, username: session.username, avatar: session.avatar, premiereVisite: (m && m.premiereVisite) || now, derniereVisite: now };
  await store(event).setJSON("membres", membres);
}

// Profils personnalisés : { [id]: { bio, couleur, jeuxFavoris, pseudos, reseaux, majLe, majPar } }
async function lireProfils(event) { return (await store(event).get("profils", { type: "json" })) || {}; }
async function ecrireProfils(event, p) { await store(event).setJSON("profils", p); }

// Bannis du site : { [id]: { nom, raison, par, le } }
async function lireBannis(event) { return (await store(event).get("bannis", { type: "json" })) || {}; }
async function ecrireBannis(event, b) { await store(event).setJSON("bannis", b); }

// Infos du serveur (propriétaire + rôles), gardées 60 s en mémoire
let cacheServeur = { t: 0, data: null };
async function serveur() {
  if (cacheServeur.data && Date.now() - cacheServeur.t < 60000) return cacheServeur.data;
  const r = await fetch(`${API}/guilds/${process.env.DISCORD_GUILD_ID}`, {
    headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
  });
  if (!r.ok) return null;
  const g = await r.json();
  cacheServeur = { t: Date.now(), data: g };
  return g;
}

// Admin = UNIQUEMENT le propriétaire du serveur + les personnes désignées :
//  - ADMIN_IDS      : identifiants Discord de membres, séparés par des virgules
//  - ADMIN_ROLE_IDS : identifiants de rôles Discord, séparés par des virgules
// Avoir la permission "Administrateur" sur Discord ne suffit PAS.
const liste = (v) => (v || "").split(",").map((x) => x.trim()).filter(Boolean);
async function estAdmin(session, rolesDuMembre) {
  if (!session) return false;
  if (liste(process.env.ADMIN_IDS).includes(session.id)) return true;
  const rolesAdmin = liste(process.env.ADMIN_ROLE_IDS);
  const roles = rolesDuMembre || session.roles || [];
  if (rolesAdmin.some((r) => roles.includes(r))) return true;
  const g = await serveur();
  return Boolean(g && g.owner_id === session.id);
}

// Vérification "fraîche" des rôles au moment d'enregistrer
async function estAdminLive(session) {
  if (!session) return false;
  const r = await fetch(`${API}/guilds/${process.env.DISCORD_GUILD_ID}/members/${session.id}`, {
    headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
  });
  const m = r.ok ? await r.json() : null;
  return estAdmin(session, m ? m.roles : []);
}

function json(code, body, extra = {}) {
  return { statusCode: code, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...extra }, body: JSON.stringify(body) };
}

export { store, lireContenu, ecrireContenu, lireMembres, noterVisite, lireProfils, ecrireProfils, lireBannis, ecrireBannis, serveur, estAdmin, estAdminLive, json, VIDE };
