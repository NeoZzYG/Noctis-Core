// ============ CONFIG NOCTIS : A PERSONNALISER ============
const NOCTIS = {
  discordInvite: "https://discord.gg/gkhTGB5mc7",
  twitch: "https://www.twitch.tv/TA-CHAINE",
  // Jeux proposés dans l'onglet Tournois et Palmarès de l'espace admin (le compétitif)
  jeuxTournois: ["League of Legends", "Call of Duty", "Valorant"],
  // Palmarès : ajoute une ligne à la fin de chaque tournoi (le plus récent en haut)
  // Le nombre de tournois affiché sur l'accueil se calcule tout seul à partir de cette liste.
  palmares: [
    // { tournoi: "Tournoi d'ouverture", jeu: "Soirée LoL", date: "2026-10-24", vainqueur: "Team Alpha", finaliste: "Team Bravo", participants: 16 },
  ],
  // Règlement général affiché sur la page Tournois
  reglement: [
    "Fair-play obligatoire : insultes, triche ou abandon volontaire = exclusion du tournoi.",
    "Être présent sur le vocal Discord 15 minutes avant le début pour le check-in.",
    "Un retard de plus de 10 minutes après l'heure du match = défaite par forfait.",
    "Les décisions des organisateurs sont définitives. En cas de litige, on en parle calmement en MP.",
    "Les captures d'écran de fin de partie servent de preuve : pense à les faire.",
  ],
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

let MOI = null;
async function initCompte() {
  const zone = document.getElementById("compte");
  const user = await getUser();
  MOI = user;
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
  { mots: ["lol", "league of"], nom: "League of Legends", sigle: "LoL", couleur: "#c8aa6e" },
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
  const n = ` ${(nom || "").toLowerCase()} `;
  const auto = THEMES_JEUX.find((t) => t.mots.some((m) => new RegExp(`[^a-z0-9]${m}`).test(n)));
  const perso = (NOCTIS.jeux || []).find((j) => j.nom && n.trim() === j.nom.toLowerCase().trim());
  if (perso) return { nom: perso.nom, sigle: perso.sigle || (auto && auto.sigle) || perso.nom.slice(0, 3), couleur: perso.couleur || (auto && auto.couleur) || "#c69428", image: perso.image };
  return auto || { nom: "Noctis", sigle: "NC", couleur: "#c69428" };
}

// ============ CONTENU MODIFIABLE DEPUIS L'ESPACE ADMIN ============
// Tant que rien n'a été enregistré dans l'admin, le site utilise les valeurs du haut de ce fichier.
let ADMIN = false;
const TZ = "Europe/Paris";
const pad = (n) => String(n).padStart(2, "0");

async function chargerContenu() {
  try {
    const r = await fetch("/api/contenu", { credentials: "same-origin" });
    if (r.ok) {
      const d = await r.json();
      ADMIN = Boolean(d.admin);
      if (d.contenu) ["events", "tournois", "jeux", "staff", "produits", "palmares", "reglement"].forEach((k) => {
        if (Array.isArray(d.contenu[k])) NOCTIS[k] = d.contenu[k];
      });
    }
  } catch {}
  NOCTIS.events = NOCTIS.events || [];
  NOCTIS.tournois = NOCTIS.tournois || [];
  if (ADMIN) document.querySelectorAll(".nav, .nav-mobile").forEach((n) => {
    if (!n.querySelector(".lien-admin")) n.insertAdjacentHTML("beforeend",
      `<a href="/admin.html" class="lien-admin"${location.pathname.startsWith("/admin") ? ' aria-current="page"' : ""}>Admin</a>`);
  });
  return NOCTIS;
}

// Events / tournois à venir ou en cours (on les garde affichés 4 h après le début)
function aVenir(liste) {
  const limite = Date.now() - 4 * 3600e3;
  return (liste || []).filter((e) => e.date && new Date(e.date).getTime() > limite)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}
const jourParis = (d) => d.toLocaleDateString("fr-CA", { timeZone: TZ });
function relatif(debut) {
  const diff = Math.round((new Date(jourParis(debut)) - new Date(jourParis(new Date()))) / 86400000);
  if (diff === 0) return parseInt(debut.toLocaleString("fr-FR", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" }), 10) >= 18 ? "Ce soir" : "Aujourd'hui";
  return diff === 1 ? "Demain" : `Dans ${diff} jours`;
}
function dateLongue(d, court) {
  return new Date(d).toLocaleString("fr-FR", { timeZone: TZ, weekday: court ? "short" : "long", day: "numeric", month: court ? "short" : "long", hour: "2-digit", minute: "2-digit" }).replace(/^./, (l) => l.toUpperCase());
}
const estInscrit = (e) => Boolean(MOI && (e.inscrits || []).some((i) => i.id === MOI.id));

function avatars(inscrits, max = 5) {
  const l = inscrits || [];
  if (!l.length) return "";
  return `<span class="avatars" title="${esc(l.map((i) => i.nom).join(", "))}">${l.slice(0, max).map((i) =>
    `<img src="${esc(i.avatar)}" alt="" loading="lazy">`).join("")}${l.length > max ? `<b>+${l.length - max}</b>` : ""}</span>`;
}

// Bouton d'inscription (events et tournois)
function boutonInscription(e, classe = "btn-ev", texte = "Je participe") {
  if (new Date(e.date) <= new Date()) return "";
  const n = (e.inscrits || []).length;
  if (estInscrit(e)) return `<button type="button" class="btn ${classe} inscrit" data-participer="${esc(e.id)}" title="Clique pour te désinscrire">Inscrit ✓</button>`;
  if (e.places && n >= e.places) return `<button type="button" class="btn btn-ghost" disabled>Complet</button>`;
  return `<button type="button" class="btn ${classe}" data-participer="${esc(e.id)}">${texte}</button>`;
}
async function participer(id) {
  const r = await fetch("/api/participer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.erreur || "erreur");
  return d;
}
// Clic sur un bouton d'inscription : met à jour la liste et relance l'affichage
function brancherInscriptions(racine, rendre) {
  racine.addEventListener("click", async (ev) => {
    const b = ev.target.closest("[data-participer]");
    if (!b) return;
    b.disabled = true;
    try {
      const d = await participer(b.dataset.participer);
      const e = [...NOCTIS.events, ...NOCTIS.tournois].find((x) => x.id === b.dataset.participer);
      if (e) e.inscrits = d.inscrits;
      rendre();
    } catch (err) {
      b.disabled = false;
      alert(err.message === "complet" ? "Désolé, c'est complet." : "L'inscription n'a pas marché, réessaie dans un instant.");
    }
  });
}

// Décompte générique : chaque carte a data-debut et un bloc .zone-decompte
function majDecomptes(racine, classeDecompte, messageLive) {
  racine.querySelectorAll("[data-debut]").forEach((li) => {
    let s = Math.floor((new Date(li.dataset.debut) - Date.now()) / 1000);
    const badge = li.querySelector(".quand-rel"), zone = li.querySelector(".zone-decompte");
    if (s <= 0) {
      if (!badge.classList.contains("live")) { badge.className = "quand-rel live"; badge.textContent = "En cours"; zone.innerHTML = `<p class="live-msg">${messageLive}</p>`; }
      return;
    }
    badge.textContent = relatif(new Date(li.dataset.debut));
    if (!zone.firstElementChild) zone.innerHTML = `<div class="${classeDecompte}" role="timer"><div><b></b><span>j</span></div><div><b></b><span>h</span></div><div><b></b><span>min</span></div><div><b></b><span>sec</span></div></div>`;
    const b = zone.querySelectorAll("b"), j = Math.floor(s / 86400); s %= 86400;
    const h = Math.floor(s / 3600); s %= 3600;
    b[0].textContent = pad(j); b[1].textContent = pad(h); b[2].textContent = pad(Math.floor(s / 60)); b[3].textContent = pad(s % 60);
  });
}
