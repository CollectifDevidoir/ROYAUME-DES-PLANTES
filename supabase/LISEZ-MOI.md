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
4. **Indiquer l'adresse de l'appli.** Dans **Authentication > URL Configuration**, mets dans « Site URL » l'adresse où l'appli est publiée, par exemple `https://antoinestager-cell.github.io/royaume-/`. Ajoute la même adresse dans « Redirect URLs ». Les liens reçus par e-mail renvoient vers cette adresse.
5. **Brancher l'appli.** Dans **Project Settings > API** (ou **API Keys**), copie l'**URL du projet** et la **clé publique**. C'est la clé « anon » ou « publishable », jamais la clé « service_role » ou « secret ». Colle-les dans `index.html`, sur la ligne :
   ```js
   const SB_URL='',SB_KEY='';
   ```
   par exemple : `const SB_URL='https://abcdefgh.supabase.co',SB_KEY='eyJhbGciOi…';`
6. **Publier l'appli en https**, par exemple avec GitHub Pages sur ce dépôt.
   - Ouverte en fichier local, l'appli permet la connexion par mot de passe, mais pas le lien par e-mail : le bouton est alors masqué.

La clé publique peut figurer dans le fichier : elle est faite pour ça. La sécurité vient de la base, où toutes les règles sont dans `schema.sql`.

## Bon à savoir sur le plan gratuit

- Largement suffisant pour un groupe d'amis : 50 000 utilisateurs actifs par mois et 500 Mo de base. Une progression pèse quelques dizaines de Ko.
- **Un projet gratuit se met en pause après une semaine sans aucune activité.** Il se réactive d'un clic depuis le tableau de bord Supabase. Pendant la pause, l'appli continue de marcher hors compte. L'onglet Profil affiche alors « Pas de connexion pour l'instant ».
- Les e-mails d'authentification du service intégré sont limités à quelques envois par heure. C'est suffisant entre amis. Au-delà, on peut brancher son propre serveur d'e-mails (Authentication > Emails > SMTP).

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
  - messages d'erreur, reprise de la progression sur un nouvel appareil, session gardée au rechargement ;
  - déconnexion et suppression du compte.

Ils demandent `@electric-sql/pglite` et `@supabase/supabase-js`, installés comme Playwright :
`npm i -g @electric-sql/pglite @supabase/supabase-js`.

**Version de la bibliothèque.** L'appli charge `supabase-js` 2.117.3 depuis jsDelivr, avec une empreinte d'intégrité (SRI) : le navigateur refuse un fichier modifié. Pour changer de version, il faut mettre à jour `SB_LIB` et `SB_SRI` ensemble.
