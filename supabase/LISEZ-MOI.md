# Comptes et amis avec Supabase

L'onglet **Profil** de l'appli fonctionne en deux temps :

- **Sans configuration** (état actuel) : il montre ton bilan, calculé sur l'appareil (rang, espèces acquises, réussite sur 14 jours, jours de suite). Rien n'est envoyé nulle part. Une ligne indique que les comptes ne sont pas encore activés.
- **Une fois Supabase branché** : création de compte, pseudo, code ami, tableau du jour avec tes amis et sauvegarde de la progression en ligne.

L'appli reste utilisable sans compte et sans connexion. La bibliothèque Supabase n'est téléchargée que si l'on ouvre l'onglet Profil ou si une session est déjà ouverte.

## Ce que voient les amis

Rien de plus que le tableau prévu :

| Visible par mes amis | Jamais visible |
|---|---|
| Pseudo et rang | Adresse e-mail |
| Espèces acquises, réussite, jours de suite | Détail de la progression (plantes, erreurs, réglages) |
| Exercices, réussite et nouvelles plantes du jour | Les amis de mes amis |

Un ami s'ajoute avec son **code ami** (par exemple `RPL-K7Q2M`). L'amitié est réciproque : chacun voit l'autre. On peut retirer un ami à tout moment (« Gérer mes amis »).

**Pourquoi pas « @Antoine » ?** Avec une recherche par pseudo, n'importe qui pourrait s'ajouter et voir tes chiffres. Le code ami, lui, se partage volontairement. Pour éviter qu'on devine les codes, chaque compte est limité à 20 essais par heure.

## Mise en route (une seule fois, environ 15 minutes)

1. **Créer le projet.** Sur [supabase.com](https://supabase.com), crée un compte puis un projet (plan gratuit). Choisis une région européenne, par exemple Paris ou Francfort.
2. **Créer la base.** Dans le projet, ouvre **SQL Editor**, puis **New query**. Colle tout le contenu de `supabase/schema.sql` et clique sur **Run**. Le script peut être relancé sans risque.
3. **Régler la connexion par e-mail.** Dans **Authentication > Sign In / Providers**, le fournisseur **Email** est activé par défaut.
   - « Confirm email » activé : chaque nouveau compte doit cliquer sur un lien reçu par e-mail. C'est plus sûr, et c'est le réglage conseillé si l'appli est en ligne.
   - Désactivé : le compte est utilisable tout de suite. C'est pratique entre amis, ou si l'appli est ouverte en fichier local.
4. **Indiquer l'adresse de l'appli.** Dans **Authentication > URL Configuration**, mets dans « Site URL » l'adresse où l'appli est publiée, `https://collectifdevidoir.github.io/ROYAUME-DES-PLANTES/` (voir « Mettre l'appli en ligne »). Ajoute la même adresse dans « Redirect URLs ». Les liens reçus par e-mail renvoient vers cette adresse.
5. **Brancher l'appli.** C'est fait pour ton projet : `index.html` contient l'adresse `https://hcbzkpsxqxhmqcblfsnm.supabase.co` et ta clé publique (`sb_publishable_…`).
   - L'adresse à utiliser est **l'URL du projet**, de la forme `https://<identifiant>.supabase.co`. On la trouve dans **Project Settings > Data API** (ou en haut de **Project Settings > API Keys**). Ce n'est **pas** l'adresse de la page du tableau de bord affichée dans la barre du navigateur (`https://supabase.com/dashboard/project/…`). Si elle est collée par erreur, l'appli la corrige d'elle-même.
   - La clé est la clé **publique** (« publishable » ou « anon »), jamais la clé **secrète** (« secret » ou « service_role »). Si une clé secrète est collée, l'appli la refuse et n'envoie rien.
6. **Tant que l'appli n'est pas en ligne** (ouverte en fichier sur ton ordinateur ou ton téléphone) :
   - désactive « Confirm email » (étape 3), sinon le lien de confirmation renverrait vers une adresse qui n'existe pas encore ;
   - le lien de connexion par e-mail n'est pas proposé. La connexion par mot de passe fonctionne.
7. **Mettre l'appli en ligne** : voir la section suivante. Ensuite, réactive « Confirm email » si tu le souhaites, et renseigne l'adresse publiée à l'étape 4.

## Personnaliser l'e-mail de confirmation

Le texte de l'e-mail envoyé à la création d'un compte ne se trouve pas dans l'appli : il se règle dans Supabase. Le modèle prêt à l'emploi est `supabase/e-mails/confirmation.html`.

**Sur un projet gratuit récent, Supabase ne laisse modifier ce texte qu'avec son propre serveur d'envoi (SMTP)** : c'est le bouton « Set up SMTP » affiché sur la page des modèles. Sans lui, l'e-mail par défaut de Supabase (en anglais) continue de fonctionner. Un serveur d'envoi a deux autres avantages : l'e-mail part au nom du royaume, et on n'est plus limité à 2 e-mails par heure.

### 1. Choisir un serveur d'envoi (gratuit)

| Solution | Pour qui | Réglages à reporter dans Supabase |
|---|---|---|
| **Gmail** avec un « mot de passe d'application » | Le plus simple sans nom de domaine. Crée de préférence une adresse dédiée (par exemple `royaumedesplantes@gmail.com`). Jusqu'à 500 e-mails par jour. | Hôte `smtp.gmail.com`, port `465`, identifiant : l'adresse Gmail, mot de passe : le mot de passe d'application (16 caractères) |
| **Brevo** ou **Resend** | Si le collectif a un nom de domaine (par exemple `devidoir.fr`) : l'e-mail part de `bonjour@devidoir.fr`, avec la meilleure délivrabilité. | Hôte, port, identifiant et mot de passe indiqués par le service, après la vérification du domaine |

Pour Gmail : sur le compte Google, active la **validation en deux étapes**, puis crée un mot de passe sur la page **Mots de passe des applications** (myaccount.google.com/apppasswords). Ce n'est pas le mot de passe habituel du compte. Ne le mets jamais dans le dépôt : il ne va que dans Supabase.

### 2. Brancher le serveur dans Supabase

1. **Authentication > Emails**, onglet **SMTP Settings**, active **Enable custom SMTP**.
2. « Sender email » : l'adresse d'envoi (celle de Gmail, ou celle du domaine). « Sender name » : `Le royaume des plantes`.
3. Reporte l'hôte, le port, l'identifiant et le mot de passe du tableau ci-dessus, puis **Save changes**.
4. Facultatif : **Authentication > Rate Limits** permet de relever le nombre d'e-mails autorisés par heure.

### 3. Coller le modèle

1. **Authentication > Emails**, onglet **Templates**, choisis **Confirm signup**.
2. « Subject » (objet) : `Confirme ton adresse e-mail 🌿`
3. Dans « Message body », onglet **Source**, remplace tout le contenu par celui de `supabase/e-mails/confirmation.html` (du `<!doctype html>` au `</html>` final), puis **Save changes**.
4. Garde tel quel `{{ .ConfirmationURL }}` : Supabase le remplace par le lien de confirmation de chaque compte.

Pour vérifier, crée un compte de test avec une autre adresse : l'e-mail reçu doit afficher le nouveau texte et le bouton « Confirmer mon adresse e-mail ». S'il arrive dans les indésirables, c'est le plus souvent l'adresse d'envoi : une adresse sur un nom de domaine vérifié (Brevo, Resend) règle ce problème.

## Mettre l'appli en ligne et recevoir les mises à jour

Je travaille sur la branche `claude/improve-html-app-e7b6o4` du dépôt. Le plus simple est de publier l'appli **directement depuis cette branche** : chaque modification que je pousse est alors en ligne une minute plus tard, sans rien faire. Ta configuration Supabase étant dans `index.html` sur cette branche, elle est conservée à chaque mise à jour.

Le dépôt est **public** et appartient à l'organisation GitHub **collectifdevidoir** (il a été transféré depuis le compte `antoinestager-cell`). Il ne contient rien de secret : la clé Supabase est publique par conception.

L'appli est publiée par **GitHub Pages** à l'adresse **`https://collectifdevidoir.github.io/ROYAUME-DES-PLANTES/`**.

Réglage en place, à vérifier si l'appli n'est plus en ligne :
1. Sur GitHub, dans le dépôt `collectifdevidoir/ROYAUME-DES-PLANTES` : **Settings > Pages**.
2. « Build and deployment » > Source : **Deploy from a branch** > Branch : `claude/improve-html-app-e7b6o4`, dossier `/ (root)` > **Save**.
3. Une à deux minutes après chaque modification poussée, la nouvelle version est en ligne. L'adresse s'affiche en haut de la page Settings > Pages.

Les anciennes adresses en `antoinestager-cell.github.io` ne fonctionnent plus. Dans Supabase, **Authentication > URL Configuration**, « Site URL » et « Redirect URLs » doivent contenir la nouvelle adresse, sinon les liens reçus par e-mail renvoient vers une page introuvable.

Sur téléphone, ouvre l'adresse puis « Ajouter à l'écran d'accueil » : l'appli s'ouvre alors comme une application.

**Si tu modifies toi-même un fichier sur GitHub**, dis-le-moi au début de notre échange suivant. Je repars toujours de la dernière version du dépôt, mais une modification faite pendant que je travaille peut entrer en conflit avec la mienne.

La clé publique peut figurer dans le fichier : elle est faite pour ça. La sécurité vient de la base, où toutes les règles sont dans `schema.sql`.

## Bon à savoir sur le plan gratuit

- Largement suffisant pour un groupe d'amis : 50 000 utilisateurs actifs par mois et 500 Mo de base. Une progression pèse quelques dizaines de Ko.
- **Un projet gratuit se met en pause après une semaine sans aucune activité.** Il se réactive d'un clic depuis le tableau de bord Supabase. Pendant la pause, l'appli continue de marcher hors compte. L'onglet Profil affiche alors « Le serveur des comptes ne répond pas… » avec un bouton Réessayer.
- Les e-mails d'authentification du service intégré sont limités à quelques envois par heure. C'est suffisant entre amis. Au-delà, on branche son propre serveur d'e-mails : voir « Personnaliser l'e-mail de confirmation ».

## Fonctionnement côté appli

| Moment | Ce qui se passe |
|---|---|
| Première connexion sur un appareil | La progression du compte et celle de l'appareil sont **fusionnées**, sans rien perdre : pour chaque plante, la fiche la plus travaillée ; pour chaque jour, le plus rempli. |
| Après chaque réponse | 4 secondes après la dernière réponse, l'appli envoie les chiffres du jour et sauvegarde la progression. Elle le fait aussi quand on quitte l'appli. |
| Onglet Profil | Tableau du jour : moi et mes amis, du plus actif au moins actif. Bouton « Actualiser ». |
| « Supprimer mon compte » | Efface le compte, le pseudo, les amitiés et la sauvegarde en ligne. La progression reste sur l'appareil. |

La connexion par Google, Apple, etc. (OAuth) pourra s'ajouter plus tard. Elle demande de déclarer l'appli chez chaque fournisseur.

## Contrôles automatiques (sans réseau, sans compte Supabase)

- `outils/controle_supabase_sql.js` exécute `schema.sql` sur une vraie base PostgreSQL embarquée (PGlite). Il vérifie le parcours complet et la sécurité :
  - tables inaccessibles en direct, visiteur non connecté refusé ;
  - un utilisateur ne voit que ses amis et ne modifie que ses propres données ;
  - limite d'essais de codes ;
  - suppression du compte avec toutes ses données.
- `outils/controle_comptes.js` fait le test de bout en bout dans le navigateur, avec la **vraie bibliothèque supabase-js**. Elle parle à un faux Supabase (`outils/supabase/faux_supabase.js`) adossé à la même base PGlite. Il couvre :
  - deux appareils : création de compte, pseudo, ajout d'un ami, tableau du jour ;
  - messages d'erreur, reprise de la progression sur un nouvel appareil, session gardée au rechargement, lien de connexion par e-mail (l'appli y est servie à une adresse https simulée) ;
  - réseau coupé, adresse du tableau de bord collée par erreur, clé secrète refusée ;
  - déconnexion et suppression du compte.

Ils demandent `@electric-sql/pglite` et `@supabase/supabase-js`, installés comme Playwright :
`npm i -g @electric-sql/pglite @supabase/supabase-js`.

**Version de la bibliothèque.** L'appli charge `supabase-js` 2.117.3 depuis jsDelivr, avec une empreinte d'intégrité (SRI) : le navigateur refuse un fichier modifié. Pour changer de version, il faut mettre à jour `SB_LIB` et `SB_SRI` ensemble.
