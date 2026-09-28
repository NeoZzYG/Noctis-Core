// Stockage du contenu du site (events, tournois, jeux, staff...) dans Netlify Blobs
const { connectLambda, getStore } = require("@netlify/blobs");

const API = "https://discord.com/api/v10";
const ADMINISTRATOR = 0x8n;

function store(event) {
  connectLambda(event);
  return getStore({ name: "noctis", consistency: "strong" });
}

const VIDE = { events: [], tournois: [], jeux: [], staff: [], produits: [], palmares: [], reglement: [] };

async function lireContenu(event) {
  const c = await store(event).get("contenu", { type: "json" });
  return c ? { ...VIDE, ...c } : null;
}

async function ecrireContenu(event, contenu) {
  await store(event).setJSON("contenu", contenu);
}

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

// Admin = propriétaire du serveur, ou rôle avec la permission Administrateur, ou ID dans ADMIN_IDS
async function estAdmin(session, rolesDuMembre) {
  if (!session) return false;
  const ids = (process.env.ADMIN_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (ids.includes(session.id)) return true;
  const g = await serveur();
  if (!g) return false;
  if (g.owner_id === session.id) return true;
  const roles = rolesDuMembre || session.roles || [];
  return (g.roles || []).some((r) => roles.includes(r.id) && (BigInt(r.permissions) & ADMINISTRATOR) === ADMINISTRATOR);
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

module.exports = { store, lireContenu, ecrireContenu, estAdmin, estAdminLive, json, VIDE };
