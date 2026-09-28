const { getSession, sign, cookie, SESSION_COOKIE } = require("../session.cjs");
const { noterVisite, lireBannis } = require("../store.cjs");

const DUREE = 60 * 60 * 24 * 400;

exports.handler = async (event) => {
  const session = getSession(event);
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  if (!session) return { statusCode: 401, headers, body: JSON.stringify({ user: null }) };

  const { exp, ...donnees } = session;

  // Membre banni du site : on coupe sa connexion
  const bannis = await lireBannis(event).catch(() => ({}));
  if (bannis[donnees.id]) {
    headers["Set-Cookie"] = cookie(SESSION_COOKIE, "", 0);
    return { statusCode: 403, headers, body: JSON.stringify({ user: null, banni: true, raison: bannis[donnees.id].raison || "" }) };
  }

  // Statut "vu sur le site" (sans bloquer la page si le stockage a un souci)
  try { await noterVisite(event, donnees); } catch {}

  // Connexion "à vie" : à chaque visite, la session repart pour 400 jours
  headers["Set-Cookie"] = cookie(SESSION_COOKIE, sign(donnees, DUREE), DUREE);
  return { statusCode: 200, headers, body: JSON.stringify({ user: donnees }) };
};
