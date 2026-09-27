const crypto = require("crypto");
const { cookie, STATE_COOKIE } = require("./lib/session");

exports.handler = async () => {
  const state = crypto.randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: `${process.env.SITE_URL}/api/auth-callback`,
    response_type: "code",
    scope: "identify guilds.members.read",
    state,
    prompt: "none",
  });
  return {
    statusCode: 302,
    headers: {
      Location: `https://discord.com/oauth2/authorize?${params}`,
      "Set-Cookie": cookie(STATE_COOKIE, state, 600),
    },
  };
};
