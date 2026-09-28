// Garde du site : il faut être connecté avec Discord pour voir les pages.
// Les pages non connectées sont renvoyées vers /connexion.html.
const PUBLIC = [/^\/connexion(\.html)?$/, /^\/style\.css$/, /^\/app\.js$/, /^\/robots\.txt$/, /^\/favicon/];
// Les robots d'aperçu (Discord, réseaux) peuvent lire les pages pour afficher la carte du lien
const ROBOTS = /discordbot|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot/i;

function b64url(buf) {
  let s = "";
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sessionValide(token, secret) {
  if (!token || !secret) return false;
  const [corps, sig] = token.split(".");
  if (!corps || !sig) return false;
  const cle = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const attendu = b64url(await crypto.subtle.sign("HMAC", cle, new TextEncoder().encode(corps)));
  if (attendu !== sig) return false;
  try {
    const bin = atob(corps.replace(/-/g, "+").replace(/_/g, "/"));
    const data = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
    return data.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export default async (request, context) => {
  const url = new URL(request.url);
  if (PUBLIC.some((r) => r.test(url.pathname))) return context.next();
  if (ROBOTS.test(request.headers.get("user-agent") || "")) return context.next();

  const token = context.cookies.get("nc_session");
  if (await sessionValide(token, Netlify.env.get("SESSION_SECRET"))) return context.next();

  const retour = encodeURIComponent(url.pathname + url.search);
  return Response.redirect(new URL(`/connexion.html?retour=${retour}`, url), 302);
};

export const config = { path: "/*", excludedPath: ["/assets/*", "/api/*", "/.netlify/*"] };
