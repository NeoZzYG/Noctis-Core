// Qui est en live sur Twitch parmi les streamers Noctis ?
// Nécessite TWITCH_CLIENT_ID et TWITCH_CLIENT_SECRET (appli gratuite sur dev.twitch.tv)
import { getSession } from "../session.mjs";
import { lireContenu, json } from "../store.mjs";

let jeton = { valeur: "", expire: 0 };
async function jetonTwitch(id, secret) {
  if (jeton.valeur && Date.now() < jeton.expire) return jeton.valeur;
  const r = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: id, client_secret: secret, grant_type: "client_credentials" }),
  });
  if (!r.ok) return "";
  const d = await r.json();
  jeton = { valeur: d.access_token, expire: Date.now() + (d.expires_in - 300) * 1000 };
  return jeton.valeur;
}
const loginTwitch = (url) => ((url || "").match(/twitch\.tv\/([A-Za-z0-9_]{3,25})/i) || [])[1] || "";

export const handler = async (event) => {
  if (!getSession(event)) return json(401, { live: {} });
  const id = process.env.TWITCH_CLIENT_ID, secret = process.env.TWITCH_CLIENT_SECRET;
  if (!id || !secret) return json(200, { live: {}, configure: false });

  const contenu = await lireContenu(event);
  const logins = [...new Set(((contenu && contenu.streamers) || [])
    .filter((s) => s.plateforme === "twitch").map((s) => loginTwitch(s.lien).toLowerCase()).filter(Boolean))].slice(0, 100);
  if (!logins.length) return json(200, { live: {}, configure: true });

  const t = await jetonTwitch(id, secret);
  if (!t) return json(200, { live: {}, configure: false });
  const r = await fetch(`https://api.twitch.tv/helix/streams?${logins.map((l) => `user_login=${encodeURIComponent(l)}`).join("&")}`, {
    headers: { "Client-Id": id, Authorization: `Bearer ${t}` },
  });
  if (!r.ok) return json(200, { live: {}, configure: true });
  const live = {};
  ((await r.json()).data || []).forEach((s) => {
    live[s.user_login.toLowerCase()] = {
      titre: s.title, jeu: s.game_name, viewers: s.viewer_count, depuis: s.started_at,
      miniature: (s.thumbnail_url || "").replace("{width}", "640").replace("{height}", "360"),
    };
  });
  return json(200, { live, configure: true }, { "Cache-Control": "public, max-age=60" });
};
