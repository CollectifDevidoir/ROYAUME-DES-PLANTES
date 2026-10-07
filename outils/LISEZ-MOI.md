# Outils de contrôle et de données

Tous les scripts Node s'appuient sur Playwright et Chromium. Lancement depuis la racine du dépôt, par exemple :
`NODE_PATH=$(npm root -g) node outils/recette.js`.
Le réseau n'est pas nécessaire : `banc_essai.js` simule iNaturalist et génère des photos.

## Recette et contrôles

| Outil | Rôle |
|---|---|
| `recette.js [fichier] [dossier]` | Recette complète sur les 7 tailles de référence (360×640 à 1920×1080) : tous les écrans, aucune erreur JavaScript, aucun défilement horizontal, boutons dans l'écran. Avec un dossier, enregistre les captures. Le hasard est figé pour pouvoir comparer deux passages. |
| `controle_fige.js [largeur hauteur]` | Fiche de réponse : fond figé et flouté, photo jamais recouverte, la fiche défile mais pas le fond. Variable `F` : autre fichier HTML. |
| `controle_clavier.js`, `controle_clavier_ordi.js` | Saisie sur mobile, raccourcis clavier sur ordinateur. |
| `controle_reglages.js` | Volet Réglages : objectif, vibration, sauvegarde, réinitialisation. |
| `controle_herbier.js` | Ordre de l'Herbier (acquises puis non acquises, par nom latin) et onglet Progrès. |
| `controle_niveaux.js` | Passages de niveaux (étape 6). |
| `controle_cache.js` | File d'attente des photos et plafond du cache (étape 8). |
| `mesure_photos.js [secondes] [wiki] [bloque]` | Mesure des requêtes photos en usage rapide, avec la limite d'iNaturalist (étape 8). |
| `controle_noir.js [fichier] [dossier]` | Aucune zone noire en haut de l'écran (décor), 10 formats, clair et sombre. |
| `controle_saisie.js [largeur hauteur]` | Joker (initiales dans le champ) et validation d'une réponse vide. |
| `controle_regularite.js [largeur hauteur]` | Graphique de régularité : ligne de l'objectif et initiales des jours. |
| `controle_categories.js [dossier]` | Ligne de tuiles des catégories : une ligne, aucun libellé coupé, tuile active, illustration dans chaque tuile (7 tailles). Variable `F` : autre fichier HTML. |
| `controle_confusion.js [fichier]` | Mode confusion : duel des deux espèces (photos côte à côte, médaillon centré), puis points à comparer, puis exercice. |
| `controle_illustrations.js [fichier]` | Illustrations : affichage, aucune ombre portée ni dégradé, au moins une forme contrastée à 3:1 sur son fond réel (clair et sombre, téléphone et ordinateur), rangs variés. |
| `controle_ordinateur.js [fichier]` | Version ordinateur (souris) : colonne de 1 120 px, QCM et saisie centrés face à la photo, Herbier et Progrès sur 2 colonnes, Réglages et Famille du jour en fenêtres centrées ; le téléphone garde ses volets. |
| `simulation_memoire.js [jours] [graines]` | Simulation de progression avec le vrai code de l'appli (étape 6). |

Fichiers d'appui : `banc_essai.js` (ouverture de l'appli avec un faux iNaturalist ; option `seed` pour figer le hasard) et `lance_exercice.js` (affiche un exercice d'un type donné).

## Données

| Outil | Rôle |
|---|---|
| `cles_vers_appli.py` | Vérifie les clés de `donnees/cles-revues.csv` (3 à 5 clés, 55 caractères au plus, source présente) et régénère la table `Q` de `index.html`. |
| `illustrations.py [--ecrire] [--json fichier]` | Dessine les illustrations « vignettes ludiques » (icônes, catégories, rangs), le décor de fond et la page d'ouverture et leur CSS. Avec `--ecrire`, les remplace dans `index.html`. |
| `nettoie_css.py [--ecrire]` | Repère les classes CSS que l'appli n'utilise plus et les retire avec `--ecrire`. Sans option, il affiche seulement ce qu'il retirerait. |
