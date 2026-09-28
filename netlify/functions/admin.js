// Enregistrement du contenu par un admin
const { getSession } = require("./lib/session");
const { lireContenu, ecrireContenu, estAdminLive, json, VIDE } = require("./lib/store");

const texte = (v, max = 2000) => String(v == null ? "" : v).slice(0, max);
const nombre = (v) => (v === "" || v == null || isNaN(Number(v)) ? null : Number(v));
const idSur = (v) => texte(v, 40).replace(/[^a-z0-9-]/gi, "") || Math.random().toString(36).slice(2, 10);

const NETTOYEURS = {
  events: (e) => ({ id: idSur(e.id), titre: texte(e.titre, 120), jeu: texte(e.jeu, 60), ambiance: e.ambiance === "competitif" ? "competitif" : "chill", date: texte(e.date, 40), places: nombre(e.places), description: texte(e.description, 600), image: texte(e.image, 300) }),
  tournois: (e) => ({ id: idSur(e.id), titre: texte(e.titre, 120), jeu: texte(e.jeu, 60), date: texte(e.date, 40), format: texte(e.format, 120), places: nombre(e.places), recompense: texte(e.recompense, 160), description: texte(e.description, 800), image: texte(e.image, 300) }),
  jeux: (j) => ({ id: idSur(j.id), nom: texte(j.nom, 60), sigle: texte(j.sigle, 5), couleur: /^#[0-9a-f]{6}$/i.test(j.couleur) ? j.couleur : "#c69428", detail: texte(j.detail, 160), image: texte(j.image, 300) }),
  staff: (s) => ({ id: idSur(s.id), membreId: texte(s.membreId, 25).replace(/[^0-9]/g, ""), nom: texte(s.nom, 60), role: texte(s.role, 60), couleur: /^#[0-9a-f]{6}$/i.test(s.couleur) ? s.couleur : "#c69428", avatar: texte(s.avatar, 300), avatarDiscord: texte(s.avatarDiscord, 300), username: texte(s.username, 40) }),
  produits: (p) => ({ id: idSur(p.id), nom: texte(p.nom, 80), prix: nombre(p.prix) || 0, image: texte(p.image, 300), lien: texte(p.lien, 300), membres: Boolean(p.membres) }),
  palmares: (p) => ({ id: idSur(p.id), tournoi: texte(p.tournoi, 120), jeu: texte(p.jeu, 60), date: texte(p.date, 20), vainqueur: texte(p.vainqueur, 80), finaliste: texte(p.finaliste, 80), participants: nombre(p.participants) }),
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { erreur: "methode" });
  const session = getSession(event);
  if (!(await estAdminLive(session))) return json(403, { erreur: "admin" });

  let recu;
  try { recu = JSON.parse(event.body || "{}").contenu || {}; } catch { return json(400, { erreur: "format" }); }

  const ancien = (await lireContenu(event)) || VIDE;
  const propre = {};
  for (const [cle, net] of Object.entries(NETTOYEURS)) {
    propre[cle] = (Array.isArray(recu[cle]) ? recu[cle] : []).slice(0, 100).map(net);
  }
  propre.reglement = (Array.isArray(recu.reglement) ? recu.reglement : []).slice(0, 30).map((r) => texte(r, 400)).filter(Boolean);

  // On garde les inscriptions déjà faites par les membres
  for (const cle of ["events", "tournois"]) {
    const avant = Object.fromEntries((ancien[cle] || []).map((e) => [e.id, e.inscrits || []]));
    propre[cle].forEach((e) => { e.inscrits = avant[e.id] || []; });
  }
  const reg = recu.reglages || {};
  propre.reglages = { boutiqueEnConstruction: Boolean(reg.boutiqueEnConstruction) };
  propre.majLe = new Date().toISOString();
  propre.majPar = session.name;

  await ecrireContenu(event, propre);
  return json(200, { ok: true, contenu: propre });
};
