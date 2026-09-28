const { getSession, sign, cookie, SESSION_COOKIE } = require("./lib/session");

const DUREE = 60 * 60 * 24 * 400;

exports.handler = async (event) => {
  const session = getSession(event);
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  if (!session) return { statusCode: 401, headers, body: JSON.stringify({ user: null }) };

  // Connexion "à vie" : à chaque visite, la session repart pour 400 jours
  const { exp, ...donnees } = session;
  headers["Set-Cookie"] = cookie(SESSION_COOKIE, sign(donnees, DUREE), DUREE);
  return { statusCode: 200, headers, body: JSON.stringify({ user: donnees }) };
};
