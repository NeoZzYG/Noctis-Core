import crypto from "crypto";
import { cookie, STATE_COOKIE } from "../session.mjs";

export const handler = async (event) => {
  const state = crypto.randomBytes(16).toString("hex");
  // Page où renvoyer le membre après connexion (uniquement une page du site)
  let retour = (event.queryStringParameters || {}).retour || "/";
  if (!retour.startsWith("/") || retour.startsWith("//")) retour = "/";

  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: `${process.env.SITE_URL}/api/auth-callback`,
    response_type: "code",
    // identify : pseudo et avatar · guilds.join : rejoindre le serveur Noctis automatiquement
    scope: "identify guilds.join",
    state,
    prompt: "none",
  });
  return {
    statusCode: 302,
    multiValueHeaders: {
      Location: [`https://discord.com/oauth2/authorize?${params}`],
      "Set-Cookie": [cookie(STATE_COOKIE, state, 600), cookie("nc_retour", retour, 600)],
    },
  };
};
