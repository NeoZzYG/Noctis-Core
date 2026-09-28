// Contenu du site pour les membres connectés
const { getSession } = require("./lib/session");
const { lireContenu, estAdmin, json } = require("./lib/store");

exports.handler = async (event) => {
  const session = getSession(event);
  if (!session) return json(401, { erreur: "connexion" });
  const [contenu, admin] = await Promise.all([lireContenu(event), estAdmin(session)]);
  return json(200, { contenu, admin });
};
