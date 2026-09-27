// ============ CONFIG NOCTIS : A PERSONNALISER ============
const NOCTIS = {
  discordInvite: "https://discord.gg/gkhTGB5mc7",
  twitch: "https://www.twitch.tv/TA-CHAINE",
  // Chiffres affichés dans "La team" (membres et en ligne sont récupérés en direct depuis Discord)
  tournoisJoues: 0,
  // Staff mis en avant : avatar = lien d'image (optionnel), couleur = couleur du rôle
  staff: [
    { nom: "Noctis Nx", role: "Fondateur", couleur: "#c69428", avatar: "" },
    { nom: "Pseudo", role: "Admin", couleur: "#ff4d5a", avatar: "" },
    { nom: "Pseudo", role: "Modérateur", couleur: "#6b8bff", avatar: "" },
    { nom: "Pseudo", role: "Capitaine esport", couleur: "#e6e7ec", avatar: "" },
  ],
  jeux: [
    // { nom: "Nom du jeu", detail: "Ce qu'on y fait", image: "/assets/jeux/xxx.jpg" (optionnel) },
    { nom: "Jeu 1", detail: "A remplacer dans app.js" },
    { nom: "Jeu 2", detail: "A remplacer dans app.js" },
    { nom: "Jeu 3", detail: "A remplacer dans app.js" },
  ],
  // Boutique : pour chaque produit, crée un "Payment Link" dans Stripe et colle-le dans "lien".
  // image : mets tes visuels dans public/assets/boutique/
  // membres: true => achat réservé aux gars connectés et présents sur le serveur
  produits: [
    { nom: "T-shirt Noctis", prix: 25, image: "/assets/boutique/tshirt.png", lien: "", membres: false },
    { nom: "Hoodie Noctis", prix: 45, image: "/assets/boutique/hoodie.png", lien: "", membres: false },
    { nom: "Maillot équipe NcG", prix: 40, image: "/assets/boutique/maillot.png", lien: "", membres: true },
  ],
};
// ==========================================================

const DISCORD_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.3a18.4 18.4 0 0 0-5.6 0L8.6 3a19.7 19.7 0 0 0-4.9 1.4C.6 9 -.3 13.6.1 18.1a19.9 19.9 0 0 0 6 3l1.3-2.1a13 13 0 0 1-2-1l.5-.4a14.2 14.2 0 0 0 12.2 0l.5.4-2 1 1.3 2.1a19.8 19.8 0 0 0 6-3c.5-5.2-.9-9.8-3.6-13.7ZM8.5 15.3c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm7 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z"/></svg>';

async function getUser() {
  try {
    const res = await fetch("/api/me", { credentials: "same-origin" });
    if (!res.ok) return null;
    return (await res.json()).user;
  } catch {
    return null;
  }
}

function boutonConnexion(label = "Se connecter avec Discord") {
  return `<a class="btn btn-discord" href="/api/auth-login">${DISCORD_SVG}${label}</a>`;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function initCompte() {
  const zone = document.getElementById("compte");
  const user = await getUser();
  if (zone) {
    zone.innerHTML = user
      ? `<a class="avatar-mini" href="/profil.html"><img src="${esc(user.avatar)}" alt="">${esc(user.name)}</a>`
      : boutonConnexion("Connexion");
  }
  document.querySelectorAll("[data-discord]").forEach((a) => (a.href = NOCTIS.discordInvite));
  document.querySelectorAll("[data-twitch]").forEach((a) => (a.href = NOCTIS.twitch));
  return user;
}

const ERREURS = {
  annule: "Connexion annulée. Clique sur « Se connecter avec Discord » pour réessayer.",
  session: "La connexion a expiré. Relance-la depuis le bouton Discord.",
  discord: "Discord n'a pas répondu. Réessaie dans quelques secondes.",
};
function afficherErreur() {
  const code = new URLSearchParams(location.search).get("erreur");
  const cible = document.getElementById("erreur");
  if (code && ERREURS[code] && cible) {
    cible.innerHTML = `<p class="alerte" role="alert">${ERREURS[code]}</p>`;
  }
}

// ============ THEMES DE JEUX ============
// Le jeu est détecté dans le nom de l'event Discord ("Soirée LoL", "Soirée CoD"...).
// Ajoute une ligne ici pour un nouveau jeu : mots-clés, nom affiché, sigle, couleur.
const THEMES_JEUX = [
  { mots: ["lol", "league"], nom: "League of Legends", sigle: "LoL", couleur: "#c8aa6e" },
  { mots: ["cod", "call of duty", "warzone"], nom: "Call of Duty", sigle: "CoD", couleur: "#8fb339" },
  { mots: ["among"], nom: "Among Us", sigle: "AU", couleur: "#e8323c" },
  { mots: ["valo"], nom: "Valorant", sigle: "VAL", couleur: "#ff4655" },
  { mots: ["fortnite"], nom: "Fortnite", sigle: "FN", couleur: "#3d8bff" },
  { mots: ["rocket"], nom: "Rocket League", sigle: "RL", couleur: "#2a9df4" },
  { mots: ["minecraft"], nom: "Minecraft", sigle: "MC", couleur: "#5aa846" },
  { mots: ["cs2", "counter"], nom: "Counter-Strike 2", sigle: "CS2", couleur: "#e8a33a" },
  { mots: ["fifa", "fc 2", "ea fc"], nom: "EA FC", sigle: "FC", couleur: "#20c997" },
];
function themeJeu(nom) {
  const n = ` ${nom.toLowerCase()} `;
  return THEMES_JEUX.find((t) => t.mots.some((m) => new RegExp(`[^a-z0-9]${m}`).test(n)))
    || { nom: "Noctis", sigle: "NC", couleur: "#c69428" };
}
