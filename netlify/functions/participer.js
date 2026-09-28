// Inscription / désinscription d'un membre à un event ou un tournoi
const { getSession } = require("./lib/session");
const { lireContenu, ecrireContenu, json } = require("./lib/store");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { erreur: "methode" });
  const session = getSession(event);
  if (!session) return json(401, { erreur: "connexion" });

  let id;
  try { id = JSON.parse(event.body || "{}").id; } catch { return json(400, { erreur: "format" }); }
  const contenu = await lireContenu(event);
  if (!contenu) return json(404, { erreur: "introuvable" });

  const cible = [...contenu.events, ...contenu.tournois].find((e) => e.id === id);
  if (!cible) return json(404, { erreur: "introuvable" });
  if (new Date(cible.date) < new Date()) return json(409, { erreur: "commence" });

  cible.inscrits = cible.inscrits || [];
  const dejaInscrit = cible.inscrits.some((i) => i.id === session.id);
  if (dejaInscrit) {
    cible.inscrits = cible.inscrits.filter((i) => i.id !== session.id);
  } else {
    if (cible.places && cible.inscrits.length >= cible.places) return json(409, { erreur: "complet" });
    cible.inscrits.push({ id: session.id, nom: session.name, avatar: session.avatar, le: new Date().toISOString() });
  }
  await ecrireContenu(event, contenu);
  return json(200, { ok: true, inscrit: !dejaInscrit, inscrits: cible.inscrits });
};
