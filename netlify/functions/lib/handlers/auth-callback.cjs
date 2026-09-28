const { sign, parseCookies, cookie, SESSION_COOKIE, STATE_COOKIE } = require("../session.cjs");
const { lireBannis } = require("../store.cjs");

const API = "https://discord.com/api/v10";
// Durée max d'un cookie dans les navigateurs (~400 jours), renouvelée à chaque visite
const DUREE = 60 * 60 * 24 * 400;

function fail(reason) {
  return { statusCode: 302, headers: { Location: `/connexion.html?erreur=${reason}` } };
}

exports.handler = async (event) => {
  const { code, state } = event.queryStringParameters || {};
  const cookies = parseCookies(event.headers.cookie || event.headers.Cookie);
  const guild = process.env.DISCORD_GUILD_ID;
  const bot = { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` };

  if (!code) return fail("annule");
  if (!state || state !== cookies[STATE_COOKIE]) return fail("session");

  // 1. Echange du code contre un token
  const tokenRes = await fetch(`${API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: `${process.env.SITE_URL}/api/auth-callback`,
    }),
  });
  if (!tokenRes.ok) return fail("discord");
  const { access_token } = await tokenRes.json();

  // 2. Profil Discord
  const userRes = await fetch(`${API}/users/@me`, { headers: { Authorization: `Bearer ${access_token}` } });
  if (!userRes.ok) return fail("discord");
  const user = await userRes.json();

  // Banni du site : on s'arrête là (et on ne l'ajoute pas au serveur)
  const bannis = await lireBannis(event).catch(() => ({}));
  if (bannis[user.id]) return fail("banni");

  // 3. Ajout automatique au serveur Noctis (201 = ajouté, 204 = déjà membre)
  const joinRes = await fetch(`${API}/guilds/${guild}/members/${user.id}`, {
    method: "PUT",
    headers: { ...bot, "Content-Type": "application/json" },
    body: JSON.stringify({ access_token }),
  });

  // 4. Infos du membre sur le serveur
  const memberRes = await fetch(`${API}/guilds/${guild}/members/${user.id}`, { headers: bot });
  const member = memberRes.ok ? await memberRes.json() : null;
  if (!member) return fail(joinRes.status === 403 ? "refuse" : "serveur");

  const session = sign(
    {
      id: user.id,
      username: user.username,
      name: member.nick || user.global_name || user.username,
      avatar: user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
        : `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(user.id) >> 22n) % 6n)}.png`,
      isMember: true,
      nouveau: joinRes.status === 201,
      roles: member.roles || [],
      joinedAt: member.joined_at || null,
    },
    DUREE
  );

  let retour = cookies.nc_retour || "/";
  if (!retour.startsWith("/") || retour.startsWith("//") || retour.startsWith("/connexion")) retour = "/";

  return {
    statusCode: 302,
    multiValueHeaders: {
      Location: [retour],
      "Set-Cookie": [cookie(SESSION_COOKIE, session, DUREE), cookie(STATE_COOKIE, "", 0), cookie("nc_retour", "", 0)],
    },
  };
};
