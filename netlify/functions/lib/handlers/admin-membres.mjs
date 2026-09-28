// Recherche de membres pour l'onglet Staff de l'admin
import { getSession } from "../session.mjs";
import { lireMembres, lireBannis, estAdminLive, json } from "../store.mjs";

const API = "https://discord.com/api/v10";

function avatarDiscord(u, gid, m) {
  if (m && m.avatar) return `https://cdn.discordapp.com/guilds/${gid}/users/${u.id}/avatars/${m.avatar}.png?size=256`;
  if (u.avatar) return `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=256`;
  return `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(u.id) >> 22n) % 6n)}.png`;
}

export const handler = async (event) => {
  if (!(await estAdminLive(getSession(event)))) return json(403, { erreur: "admin" });
  const q = ((event.queryStringParameters || {}).q || "").trim().slice(0, 50);
  const gid = process.env.DISCORD_GUILD_ID;
  const vus = await lireMembres(event).catch(() => ({}));

  // Onglet "Membres" : tous les membres venus sur le site + les bannis
  if ((event.queryStringParameters || {}).tous) {
    const bannis = await lireBannis(event).catch(() => ({}));
    const liste = Object.values(vus).map((m) => ({ id: m.id, nom: m.nom, username: m.username, avatar: m.avatar, vu: m.derniereVisite, premiere: m.premiereVisite, banni: bannis[m.id] || null }))
      .sort((a, b) => (b.vu || "").localeCompare(a.vu || ""));
    Object.entries(bannis).forEach(([id, b]) => { if (!vus[id]) liste.push({ id, nom: b.nom, username: "", avatar: "", vu: null, banni: b }); });
    return json(200, { membres: liste });
  }

  // 1. Tous les membres du serveur Discord (demande l'option "Server Members Intent" du bot)
  if (q) {
    const r = await fetch(`${API}/guilds/${gid}/members/search?query=${encodeURIComponent(q)}&limit=15`, {
      headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
    });
    if (r.ok) {
      const liste = (await r.json()).filter((m) => !m.user.bot).map((m) => ({
        id: m.user.id, nom: m.nick || m.user.global_name || m.user.username, username: m.user.username,
        avatar: avatarDiscord(m.user, gid, m), vu: vus[m.user.id] ? vus[m.user.id].derniereVisite : null,
      }));
      return json(200, { source: "discord", membres: liste });
    }
  }

  // 2. Sinon : les membres déjà venus sur le site
  const t = q.toLowerCase();
  const liste = Object.values(vus)
    .filter((m) => !t || (m.nom || "").toLowerCase().includes(t) || (m.username || "").toLowerCase().includes(t))
    .sort((a, b) => (b.derniereVisite || "").localeCompare(a.derniereVisite || ""))
    .slice(0, 30)
    .map((m) => ({ id: m.id, nom: m.nom, username: m.username, avatar: m.avatar, vu: m.derniereVisite }));
  return json(200, { source: "site", membres: liste });
};
