// Bannir / débannir un membre du site (admins uniquement)
const { getSession } = require("./lib/session");
const { lireBannis, ecrireBannis, lireMembres, serveur, estAdminLive, json } = require("./lib/store");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { erreur: "methode" });
  const session = getSession(event);
  if (!(await estAdminLive(session))) return json(403, { erreur: "admin" });

  let recu;
  try { recu = JSON.parse(event.body || "{}"); } catch { return json(400, { erreur: "format" }); }
  const id = String(recu.id || "").replace(/[^0-9]/g, "");
  if (!id) return json(400, { erreur: "id" });

  const g = await serveur();
  if (id === session.id || (g && g.owner_id === id)) return json(400, { erreur: "impossible" });

  const bannis = await lireBannis(event);
  if (recu.action === "debannir") {
    delete bannis[id];
  } else {
    const m = (await lireMembres(event))[id];
    bannis[id] = { nom: (m && m.nom) || recu.nom || id, raison: String(recu.raison || "").slice(0, 300), par: session.name, le: new Date().toISOString() };
  }
  await ecrireBannis(event, bannis);
  return json(200, { ok: true, bannis });
};
