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
- Le lien d'invite dans `app.js` affiche membres et en ligne en direct

### 3. Crée l'appli Discord
1. Va sur https://discord.com/developers/applications → **New Application** → nomme-la "Noctis Core"
2. Onglet **OAuth2** : copie le **Client ID**, puis **Reset Secret** et copie le **Client Secret**
3. Toujours dans OAuth2 → **Redirects** → ajoute :
   `https://TON-SITE.netlify.app/api/auth-callback`
4. ID du serveur : dans Discord, Paramètres → Avancés → active le **Mode développeur**,
   puis clic droit sur le serveur Noctis → **Copier l'identifiant du serveur**

### 3 bis. Bot Discord
Le bot sert à ajouter les membres au serveur quand ils se connectent, et à reconnaître les admins.
1. Dans la même appli Discord → onglet **Bot** → **Reset Token** → copie le token
2. Onglet **OAuth2 → URL Generator** → coche `bot`, puis la permission **Create Instant Invite** → ouvre l'URL et ajoute le bot au serveur
3. Ajoute la variable `DISCORD_BOT_TOKEN` dans Netlify

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

## Espace admin (tout se gère depuis le site)
Page **/admin.html** (lien "Admin" doré dans le menu, visible seulement par les admins).
- **Qui est admin ?** Uniquement le **propriétaire du serveur Discord**, plus les personnes que tu désignes dans Netlify :
  - `ADMIN_IDS` : identifiants Discord de membres (clic droit sur le membre → Copier l'identifiant utilisateur), séparés par des virgules
  - `ADMIN_ROLE_IDS` : identifiants de rôles (Paramètres du serveur → Rôles → clic droit sur le rôle → Copier l'identifiant), séparés par des virgules
  - La permission "Administrateur" sur Discord ne donne **pas** accès à l'admin du site
  - Après avoir modifié ces variables : Deploys → Trigger deploy
- **Onglets** : Events, Tournois, Jeux, Staff, Boutique, Palmarès, Règlement
- **Events** : les soirées de la Noctis, avec un badge **☾ Chill** ou **⚔ Compétitif** au choix
- **Tournois et Palmarès** : seulement les jeux compétitifs (LoL, CoD et Valorant). Pour en ajouter un, modifie `jeuxTournois` en haut de `public/app.js`
- **Images** : bouton "Choisir une image", elle est redimensionnée et stockée automatiquement
- Clique sur **Enregistrer** : c'est en ligne tout de suite, sans redéployer
- Les events et tournois du site sont **indépendants de Discord** : les membres s'inscrivent directement sur le site (bouton "Je participe" / "S'inscrire"), leur avatar apparaît dans la liste des inscrits
- Les données sont stockées dans **Netlify Blobs** (inclus gratuitement dans Netlify, rien à configurer)
- Tant que rien n'a été enregistré dans l'admin, le site affiche les valeurs par défaut de `public/app.js`

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
