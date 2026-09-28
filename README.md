# Site Noctis Core — Étape 1 : connexion Discord

## Ce qui marche déjà
- Accueil, pages Tournois et Classement (vides pour l'instant)
- Connexion avec Discord, reste connecté en permanence
- Détection automatique : membre du serveur Noctis ou non (badge "Membre Noctis")
- Profil : avatar, pseudo serveur, date d'arrivée, nombre de rôles

## Mise en ligne (≈ 20 min)

### 1. Ajoute ton logo
Copie `LOGO_NOCTIS.png` dans `public/assets/` et renomme-le `logo.png`.

### 2. Personnalise `public/app.js`
En haut du fichier : lien d'invitation Discord, chaîne Twitch, liste des jeux.

### Bonus accueil
- Le lien d'invite dans `app.js` suffit pour afficher membres et en ligne en direct

### 3. Crée l'appli Discord
1. Va sur https://discord.com/developers/applications → **New Application** → nomme-la "Noctis Core"
2. Onglet **OAuth2** : copie le **Client ID**, puis **Reset Secret** et copie le **Client Secret**
3. Toujours dans OAuth2 → **Redirects** → ajoute :
   `https://TON-SITE.netlify.app/api/auth-callback`
4. ID du serveur : dans Discord, Paramètres → Avancés → active le **Mode développeur**,
   puis clic droit sur le serveur Noctis → **Copier l'identifiant du serveur**

### 3 bis. Events automatiques (bot Discord)
Les events de l'accueil viennent de l'onglet **Événements** de ton serveur : tu crées l'event sur Discord, il apparaît sur le site (mise à jour toutes les 5 min).
1. Dans la même appli Discord → onglet **Bot** → **Reset Token** → copie le token
2. Onglet **OAuth2 → URL Generator** → coche `bot`, puis dans les permissions coche **Create Instant Invite** (nécessaire pour ajouter les membres au serveur à leur connexion) → ouvre l'URL et ajoute le bot au serveur
3. Ajoute la variable `DISCORD_BOT_TOKEN` dans Netlify

Conseils pour tes events :
- Mets le nom du jeu dans le titre ("Soirée LoL", "Soirée CoD", "Soirée Among Us") : le site détecte le jeu et prend sa couleur
- Ajoute une image de couverture à l'event sur Discord : elle s'affiche sur la carte
- Nouveau jeu pas reconnu ? Ajoute-le dans `THEMES_JEUX` en bas de `app.js`

### 4. Déploie sur Netlify
1. Mets le dossier sur GitHub (ou glisse-dépose le dossier dans Netlify → "Deploy manually")
2. **Site configuration → Environment variables**, ajoute :
   | Variable | Valeur |
   |---|---|
   | `DISCORD_CLIENT_ID` | Client ID de l'étape 3 |
   | `DISCORD_CLIENT_SECRET` | Client Secret de l'étape 3 |
   | `DISCORD_GUILD_ID` | ID du serveur |
   | `SESSION_SECRET` | une chaîne aléatoire longue (ex. générée sur https://1password.com/password-generator) |
   | `DISCORD_BOT_TOKEN` | token du bot (étape 3 bis) |
   | `SITE_URL` | `https://TON-SITE.netlify.app` (sans / à la fin) |
3. Redéploie (Deploys → Trigger deploy) pour que les variables soient prises en compte

⚠️ Le glisser-déposer ne déploie pas les fonctions : passe par GitHub ou par la CLI (`npx netlify deploy --prod`).

### 5. Teste
Ouvre le site → "Se connecter avec Discord" → tu dois arriver sur ton profil avec le badge doré.

## Accès au site (connexion obligatoire)
- Toutes les pages demandent d'être connecté avec Discord. Sans connexion, on arrive sur `/connexion.html` (la couverture avec le bouton "Entrer avec Discord")
- À la connexion, le membre est **ajouté automatiquement au serveur Noctis** (Discord lui affiche l'autorisation "Rejoindre des serveurs pour toi")
- Après connexion, il revient sur la page qu'il voulait voir
- Les robots d'aperçu (Discord, réseaux) peuvent toujours lire les pages pour afficher la carte du lien
- Le verrou est géré par `netlify/edge-functions/garde.js`

## Aperçu du lien sur Discord
Quand quelqu'un colle le lien du site sur Discord, une carte s'affiche : nom "Noctis Core", description, bannière et liseré doré.
- Au déploiement, nomme ton site Netlify **noctis-core** (Site configuration → Change site name) pour avoir `noctis-core.netlify.app`
- Si tu prends une autre adresse (nom de domaine perso), remplace `https://noctis-core.com` dans le haut de chaque page `.html` (Ctrl+F)
- Discord garde l'aperçu en cache : si tu modifies les textes, ajoute `?v=2` à la fin du lien pour forcer la mise à jour

## Tournois
Automatiques aussi : tout event Discord dont le titre contient **Tournoi**, **Cup** ou **Coupe** apparaît sur la page Tournois.
Dans la description de l'event, ces lignes deviennent des pastilles :
```
Format : 5v5 · élimination directe
Places : 16
Récompense : rôle Champion Noctis + 20 € de RP
Le reste de la description s'affiche en texte normal.
```
- La jauge d'inscrits se base sur les gens qui cliquent "Intéressé" sur Discord
- **Palmarès** et **règlement** : à modifier dans `public/app.js` (blocs `palmares` et `reglement`)

## Boutique
Chaque produit se configure dans `public/app.js` (bloc `produits`).
1. Crée un compte Stripe → **Payment Links** → un lien par produit (tailles en option personnalisée)
2. Colle le lien dans `lien` : le bouton passe de "Bientôt" à "Commander"
3. Visuels dans `public/assets/boutique/` (format carré)
4. `membres: true` = produit réservé aux gars connectés et présents sur le serveur

Pour démarrer, tu passes les commandes à la main sur Printful/Printify quand un paiement tombe.
L'automatisation complète (Printful API) viendra plus tard.

## Étape 2 (prochaine session)
Base de données Supabase : tournois avec inscription en un clic, résultats, classement, stats sur le profil.
