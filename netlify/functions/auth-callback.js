const { sign, parseCookies, cookie, SESSION_COOKIE, STATE_COOKIE } = require("./lib/session");

const API = "https://discord.com/api/v10";
const WEEK = 60 * 60 * 24 * 7;

function fail(reason) {
  return { statusCode: 302, headers: { Location: `/?erreur=${reason}` } };
}

exports.handler = async (event) => {
  const { code, state } = event.queryStringParameters || {};
  const cookies = parseCookies(event.headers.cookie || event.headers.Cookie);

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
  const auth = { Authorization: `Bearer ${access_token}` };

  // 2. Profil Discord
  const userRes = await fetch(`${API}/users/@me`, { headers: auth });
  if (!userRes.ok) return fail("discord");
  const user = await userRes.json();

  // 3. Membre du serveur Noctis ?
  const memberRes = await fetch(`${API}/users/@me/guilds/${process.env.DISCORD_GUILD_ID}/member`, { headers: auth });
  const member = memberRes.ok ? await memberRes.json() : null;

  const session = sign(
    {
      id: user.id,
      username: user.username,
      name: (member && member.nick) || user.global_name || user.username,
      avatar: user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
        : `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(user.id) >> 22n) % 6n)}.png`,
      isMember: Boolean(member),
      roles: (member && member.roles) || [],
      joinedAt: (member && member.joined_at) || null,
    },
    WEEK
  );

  return {
    statusCode: 302,
    multiValueHeaders: {
      Location: ["/profil.html"],
      "Set-Cookie": [cookie(SESSION_COOKIE, session, WEEK), cookie(STATE_COOKIE, "", 0)],
    },
  };
};
