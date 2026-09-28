// Contenu du site pour les membres connectés
const { getSession } = require("../session.cjs");
const { lireContenu, lireMembres, lireBannis, estAdmin, json } = require("../store.cjs");

exports.handler = async (event) => {
  const session = getSession(event);
  if (!session) return json(401, { erreur: "connexion" });
  if ((await lireBannis(event).catch(() => ({})))[session.id]) return json(403, { erreur: "banni" });
  const [contenu, membres, admin] = await Promise.all([lireContenu(event), lireMembres(event).catch(() => ({})), estAdmin(session)]);

  // Staff relié à un membre : avatar Discord à jour + dernière visite sur le site
  if (contenu) contenu.staff = (contenu.staff || []).map((s) => {
    const m = s.membreId && membres[s.membreId];
    return m ? { ...s, avatarAuto: m.avatar, vu: m.derniereVisite } : s;
  });
  return json(200, { contenu, admin });
};
