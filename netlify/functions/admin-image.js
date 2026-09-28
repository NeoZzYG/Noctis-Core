// Envoi d'une image depuis l'espace admin (déjà redimensionnée par le navigateur)
const crypto = require("crypto");
const { getSession } = require("./lib/session");
const { store, estAdminLive, json } = require("./lib/store");

const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { erreur: "methode" });
  if (!(await estAdminLive(getSession(event)))) return json(403, { erreur: "admin" });

  let data, type;
  try { ({ data, type } = JSON.parse(event.body || "{}")); } catch { return json(400, { erreur: "format" }); }
  if (!TYPES[type] || typeof data !== "string") return json(400, { erreur: "type" });
  const octets = Buffer.from(data, "base64");
  if (octets.length > 3 * 1024 * 1024) return json(413, { erreur: "taille" });

  const cle = `${crypto.randomBytes(8).toString("hex")}.${TYPES[type]}`;
  await store(event).set(`img/${cle}`, octets, { metadata: { type } });
  return json(200, { url: `/api/image?k=${cle}` });
};
