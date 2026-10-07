# Plan du lot 2 — Confort, identité visuelle, ordinateur

Analyse d'impact faite **avant toute modification**, sur le code actuel et sur des captures de l'appli : téléphone 390×844, et fenêtres d'ordinateur de 860×900, 1024×700, 1280×650, 1440×780, 1920×960 et 2560×1080.
Maquettes : `maquettes/maquette-categories.png`, `maquettes/maquette-illustrations.png`.

Règles inchangées : une étape à la fois, validation avant la suivante, contrôles et recette à chaque étape. La recette (`outils/recette.js`) compare aussi les captures téléphone **avant / après** pour prouver que le mobile n'est pas dégradé.

---

## 1. Joker

**Constat.**
- Le joker ajoute un bandeau séparé au-dessus du champ (« Indice · Q… r… »). C'est le doublon à supprimer.
- Il place aussi les initiales dans le texte d'aide du champ (*placeholder*), qui **disparaît dès qu'une lettre est tapée**.
- Le format affiché est « Q… r… ».

**Proposition.**
- Retirer le bandeau.
- Afficher les initiales **dans la zone de saisie**, à droite, sous forme d'une étiquette fixe : **« Q. r. »**. Le texte saisi s'arrête avant l'étiquette (marge réservée) et ne la recouvre jamais.
- L'étiquette reste visible jusqu'à la réponse, que l'utilisateur ait commencé à écrire ou non.
- Hybrides : « P. × h. » pour *Platanus × hispanica*.

**Impact.** Le décompte (5 jokers par jour) et la logique d'apprentissage sont inchangés. Seul l'affichage change. Le champ reste assez large à 360 px : l'étiquette prend environ 40 px.

## 2. Valider une réponse vide

**Constat.** Le moteur sait déjà traiter une réponse vide comme une erreur ordinaire. C'est seulement le formulaire qui la bloque.

**Proposition.** Accepter la validation à vide. Elle compte comme une erreur normale (niveau, série, « erreurs du jour »).

**Risque repéré et garde-fou.**
- Sur ordinateur, « Entrée » passe à la question suivante, qui met aussitôt le curseur dans le champ. Un double appui un peu rapide validerait donc une réponse vide : une erreur involontaire.
- Garde-fou proposé : une validation à vide n'est acceptée qu'**au moins 1 seconde après l'affichage de la question**. Avant ce délai, elle est ignorée, sans message. Un vrai « je ne sais pas » reste instantané à l'usage.

## 3. Boutons de catégories

**Constat.**
- Ce sont des pilules transparentes, en texte gris de 11,5 px.
- Sur ordinateur, elles sont étirées sur toute la largeur avec de grands vides entre elles.
- Leur CSS est fait de **7 surcharges successives** empilées depuis plusieurs étapes.

**Deux options maquettées dans l'appli** (voir `maquette-categories.png`) :
- **A — barre segmentée** : un seul bloc rectangulaire en 5 cases ; la case active est teintée de vert. Sobre, un peu « système ».
- **B — tuiles rectangulaires (recommandée)** : 5 tuiles égales, du même style que les cartes (fond carte, coins de 10 px, ombre légère). La tuile active reprend le **dégradé vert du bouton « Classique »** : le mode choisi a toujours la même apparence.

**Dans les deux cas** :
- une seule ligne, jusqu'à 320 px de large ;
- texte de 12 px, lisible ;
- largeur bornée sur ordinateur (voir point 7) ;
- CSS réécrit proprement en un seul bloc ;
- hauteur quasi inchangée (+4 px), donc pas d'effet sur « photo + 4 réponses sans défilement » ;
- sur ordinateur seulement, une petite illustration de la catégorie dans la tuile (la place le permet).

## 4. Graphique de régularité

**Constat.**
- 14 barres (les 14 derniers jours).
- Échelle = le plus grand de l'objectif et du meilleur jour.
- Il n'existe pas de constante `GOAL` : l'objectif est le réglage enregistré, `goal()` (40 par défaut), modifiable dans Réglages.

**Proposition.**
- Une **ligne repère pointillée** à hauteur de l'objectif, avec la mention discrète « objectif 40 ». Elle est calculée à partir de `goal()` : changer l'objectif la déplace aussitôt, y compris si l'onglet Progrès est ouvert pendant le réglage.
- Sous chaque barre, l'**initiale du jour réel** (L M M J V S D, donc deux semaines). Aujourd'hui est en gras.

**Impact.** Aucun sur les données. La hauteur du bloc grandit de 14 px pour les lettres.

## 5. Mode confusion

**Constat.**
- Progrès → Confusions → « S'entraîner » ouvre « Ne plus confondre ».
- La fiche reste **vide (« Chargement… ») plusieurs secondes**, puis n'affiche que du texte en deux colonnes : **aucune photo**.
- Sur ordinateur, c'est une petite fenêtre collée en bas de l'écran.

**Proposition, dans cet ordre :**
1. **Le duel**, affiché tout de suite :
   - deux cartes côte à côte, chacune avec la photo principale, le nom français et le nom latin ;
   - entre les deux, un médaillon d'échange avec « confondues 3× » ;
   - les noms apparaissent immédiatement, les photos dès qu'elles arrivent ; fini le « Chargement… » vide.
2. **Points à comparer** : les clés de distinction, alignées sous chaque photo.
3. « Plus de détails », inchangé.
4. **S'entraîner à les distinguer**, inchangé.

**Impact.** Le même composant sert après une erreur entre deux espèces : il en profitera. Sur ordinateur, la fenêtre devient centrée et plus large (environ 720 px).

## 6. Style des illustrations

**Constat.**
- 40 illustrations : 19 icônes, 5 catégories, 12 rangs, trophée, ampoule, cible, loupe.
- Rendu « émoji 3D » : dégradés brillants, reflets, ombres portées.
- Plusieurs sujets sont génériques (trophée, cible, ampoule, éprouvette, flocon, engrenage).
- Les rangs hauts sortent de l'univers : Gardien bleu avec des yeux, Maître du royaume rose couronné.

**Direction proposée : « carnet naturaliste »** (voir `maquette-illustrations.png`, une esquisse de direction et non le dessin final) :
- un trait d'encre sépia, plus épais en petite taille ;
- 2 à 3 aplats d'aquarelle (mousse, sauge, écorce, ocre, papier), légèrement décalés du trait comme à la main ;
- aucun dégradé brillant, reflet ni ombre portée ;
- formes simples, sans micro-détail : chaque illustration est vérifiée à 24 px ;
- des sujets botaniques à la place des pictogrammes génériques : trophée → couronne de laurier ; ampoule (Famille du jour) → étiquette d'herbier ; graphique → rondelle de bois avec ses cernes ; cible (erreurs du jour) → boussole ; loupe → loupe de naturaliste sur une feuille ; rangs → gland, germe… jusqu'au grand chêne couronné.

**Restent de simples tracés** : chevrons, croix et coches, qui sont fonctionnels.

**Décor de fond** : même traitement (troncs avec écorce, fougères, canopée feuillue), en lien avec le point 8.

**Impact.** Le poids reste du même ordre : moins de dégradés, des tracés un peu plus longs. Aucun effet sur le code. Le mode sombre est vérifié.

## 7. Version ordinateur

**Constats** (captures de 860 à 2560 px de large) :
1. **Largeurs incohérentes** : Quiz presque pleine largeur (jusqu'à 1 400 px), Herbier et Progrès en colonne étroite (500 px), en-tête de bord à bord.
2. **Catégories** étirées, texte minuscule (point 3).
3. **QCM** : la colonne de réponses est collée en haut, avec un grand vide dessous ; la question est en petit italique.
4. **Saisie** : un champ seul en haut d'une colonne vide.
5. **4 photos** : le « ? » de la question passe seul sur une ligne.
6. **Herbier** : vignettes de 50 px dans une colonne étroite.
7. **Progrès** : une seule colonne étroite, beaucoup de vide.
8. **Réglages et Aide** : volets « mobile » qui montent du bas. **Famille du jour** : carte jaune plein écran de 1 400 px pour quelques lignes.
9. **Fenêtre étroite et haute (860×900)** : elle reçoit la mise en page tablette, avec un grand blanc entre la photo et la question, et des réponses passées sous la barre d'onglets.

**Propositions** (uniquement pour l'ordinateur, à partir de 900 px de large avec souris) :
- une **colonne commune de 1 120 px au plus**, centrée, pour l'en-tête, les menus et tous les onglets ;
- **QCM et saisie** : colonne de droite centrée verticalement face à la photo, question en titre, réponses plus hautes ;
- **Herbier** : vignettes de 80 px, catégories sur 2 colonnes à partir de 1 200 px ;
- **Progrès** : 2 colonnes (Aujourd'hui et Régularité / À revoir et Confusions) ;
- **Réglages, Aide, Famille du jour, Ne plus confondre** : fenêtres centrées de taille bornée ;
- correction du « ? » orphelin et du cas 860×900.

**Garde-fou.** Les captures téléphone et tablette doivent rester **identiques au pixel près**, hors changements voulus des points 1 à 6.

## 8. Motifs noirs

**Origine exacte.**
- Le décor de fond contient une forme de canopée en haut (`<path class="czr">`) **sans couleur de remplissage**. Le navigateur la peint donc en **noir** (comportement par défaut du SVG).
- Elle n'a jamais eu de couleur, depuis l'état reçu.
- Son nom de classe est aussi partagé, par hasard, avec une ligne de tableau des fiches (`.czr`).

**Comportement.**
- Le décor est calé **en bas** de la fenêtre et rogné en haut quand la fenêtre est large.
- Plein écran 16:9 : la canopée sort par le haut, d'où l'impression que tout va bien.
- Fenêtre réduite, plus haute que large, tablette ou téléphone : elle redescend et apparaît en noir derrière l'en-tête et les menus.
- Apparition vérifiée : en **860×900** et sur **téléphone** ; absente en 1280×650.

**Correction.**
- Une vraie couleur (le vert sombre du feuillage, en transparence) et un dessin feuillu, en lien avec le point 6.
- Un nom de classe propre, sans conflit.

**Contrôle automatique.** Aucune zone noire en haut de l'écran sur 10 formats, de 320×568 à 2560×1080, en mode clair et en mode sombre.

---

## Étape A — points 8, 2, 1, 4 — FAITE

| Point | Résultat | Contrôle |
|---|---|---|
| 8. Motifs noirs | La canopée du décor a une couleur : deux couches de feuillage vert transparent, à bord festonné. Elle porte un nom de classe propre (`cn1`, `cn2`), sans conflit. | `outils/controle_noir.js` : 10 formats × clair/sombre × 2 écrans. **Avant : 33 échecs sur 40. Après : 0.** La tache était aussi visible en 1366×800, en haut à gauche. |
| 2. Réponse vide | Acceptée et comptée comme une erreur normale. Ignorée pendant la 1re seconde (garde-fou du double « Entrée »). La correction dit « Pas de réponse : voici comment la reconnaître » au lieu de « « » n'est pas dans la liste ». | `outils/controle_saisie.js` |
| 1. Joker | Bandeau séparé supprimé. Initiales « Q. r. » (« P. × h. » pour un hybride) fixées à droite **dans** le champ, visibles pendant la saisie. Le texte tapé s'arrête avant elles. Couleurs fixes, lisibles aussi en mode sombre (le champ reste blanc). | `outils/controle_saisie.js` (360×640 et 1440×780) |
| 4. Régularité | Ligne pointillée « objectif N » à la hauteur exacte de `goal()`. Elle suit le curseur des Réglages en direct. Initiales L M M J V S D sous les 14 barres, aujourd'hui en gras. | `outils/controle_regularite.js` : écart de 0 px, objectif 40 → 70 → 10 |

Non-régression : recette 133/133 et les 7 contrôles existants OK. Captures téléphone avant/après : les seules différences sont la bande du haut (canopée) et le graphique de Progrès.

## Étape B — points 3, 5 — FAITE

| Point | Résultat | Contrôle |
|---|---|---|
| 3. Catégories | Option B : une seule ligne de tuiles rectangulaires (coins de 10 px, fond carte, ombre légère). La tuile active a un dégradé vert et un texte blanc. Sur ordinateur (≥ 700 px), chaque tuile montre aussi l'icône de sa catégorie. Les zones tactiles restent à 44 px. L'ancien CSS des pastilles (grille, bulles, règles M2) est retiré. | `outils/controle_categories.js` : 7 tailles de 320 à 2560 px. Une ligne, aucun libellé coupé, tuile active lisible, icônes sur ordinateur. |
| 5. Mode confusion | La fiche s'ouvre sur un **duel** : les deux photos côte à côte, à taille égale, avec les noms français et latins dessous. Un médaillon ⇄ au centre affiche « confondues N× ». Le duel apparaît tout de suite (les noms d'abord, les photos dès qu'elles arrivent). Viennent ensuite les « Points à comparer », alignés sous chaque photo, puis le bouton d'exercice. Sur ordinateur, la fiche devient une fenêtre centrée de 720 px. | `outils/controle_confusion.js` : 5 tailles, médaillon centré à 0 px près, ordre duel → points → exercice, pas de débordement. |

Non-régression : recette 133/133 et tous les contrôles existants OK. Captures téléphone avant/après : seules la ligne des catégories (et la mise en page qui la suit, à 4 px près) et la fiche de confusion changent.

## Étape C — point 6 — FAITE (version 2)

**Retour du 7 octobre sur la version 1.** Le style « carnet naturaliste », avec son trait d'encre sépia et ses aplats décalés, faisait brouillon : l'appli avait perdu son côté ludique et fini. Il est abandonné.

**Version 2 : vignettes ludiques.**
- Formes pleines et arrondies, couleurs franches, sans trait d'encre.
- Le volume vient de deux tons, un dessous plus foncé légèrement décalé, plus un petit reflet clair. Une ombre douce au sol.
- Ni dégradé, ni filtre d'ombre portée : le rendu reste net à 20 px et léger.
- Palette de 13 teintes (vert, vert d'eau, écorce, bois, or, orange, rouge, rose, violet, bleu, nuit, papier, pierre) en 3 à 4 tons chacune. Chaque illustration prend ses propres couleurs, avec un rendu commun.
- Mode sombre : aucune adaptation nécessaire, les couleurs pleines ressortent sur les deux fonds.

**Rangs : les saisons.** Gland doré → germe et pousse sur une butte de terre → plant en pot de terre cuite → arbrisseau en fleurs roses → jeune arbre vert tendre → arbre aux fruits rouges → grand chêne et ses glands → bosquet d'automne (or, vert, orange) → forêt de sapins → Gardien sous un ciel de nuit étoilé avec la lune et des lucioles → Maître du royaume, arbre doré couronné.

**Remplacements conservés.**

| Avant | Après |
|---|---|
| Trophée | Couronne de laurier et médaille étoilée |
| Ampoule (Famille du jour) | Étiquette d'herbier |
| Cible (erreurs du jour) | Boussole |
| Histogramme (Progrès) | Rondelle de bois |
| Loupe | Loupe sur une feuille |

**Catégories sur téléphone.** Chaque tuile montre maintenant son illustration au-dessus du nom (avant : seulement sur ordinateur). La ligne tient de 320 à 2560 px, et l'écran de jeu tient toujours sans défilement en 360×640.

**Fonds verts pleins.** Sur l'onglet actif et sur la tuile active, l'illustration se pose sur une petite pastille claire, comme un badge, pour ne pas se fondre dans le vert.

**Décor.** Troncs effilés évasés au pied, frondes de fougère (inchangé depuis la version 1).

**Outils.**
- `outils/illustrations.py --ecrire` régénère les illustrations, leur CSS et le décor.
- `outils/controle_illustrations.js` vérifie :
  - chaque illustration s'affiche, sans ombre portée ni dégradé ;
  - chaque icône a au moins une forme qui contraste à 3:1 ou plus avec son fond réel, en clair et en sombre, sur téléphone et sur ordinateur. Ce contrôle a détecté le vert sur vert de l'onglet actif, d'où la pastille ;
  - les rangs ont au moins 6 couleurs dominantes différentes : il y en a 7.

**Poids.** `index.html` passe de 775 Ko à 790 Ko (+1,9 %), sans effet sur la fluidité.

## Page d'ouverture — FAITE

Même langage que le fond d'accueil, sur les trois plans de la parallaxe d'entrée :
- au loin, une lisière de houppiers ronds et de sapins ;
- au milieu, des troncs effilés sous une canopée feuillue à deux épaisseurs ;
- devant, de grands troncs évasés au pied et des frondes de fougère.

Le dessin passe d'un cadre portrait (400×800, agrandi environ 3,6 fois sur ordinateur, d'où des formes géantes) à un cadre large ancré en bas (1200×800). Sur téléphone, la bande centrale garde le cadrage d'avant : deux troncs encadrent le titre et les fougères sont au pied du bouton. L'animation d'entrée ne change pas. Aperçu : `maquettes/p-ouverture.png` (avant en haut, après en bas).

## Étape D — point 7 — FAITE

Règles réservées à l'ordinateur (souris, à partir de 760 px de large). Le téléphone et la tablette tactile ne changent pas, à deux corrections communes près, voulues (voir plus bas).

| Constat | Correction |
|---|---|
| 1. Largeurs incohérentes | Colonne commune de 1 120 px au plus. L'en-tête s'aligne sur les cartes, avec des coins arrondis en bas. |
| 3. QCM collé en haut | Question en titre (Georgia 1,45 rem). Réponses plus hautes (50 à 60 px selon la hauteur d'écran). Photo (toujours 50 % de la hauteur au plus, règle de l'étape 7) et bloc question-réponses centrés l'un face à l'autre (0 px d'écart). |
| 4. Saisie seule en haut | Champ centré face à la photo (2 px d'écart). La colonne fait au moins 340 px, pour que le champ ne soit pas tronqué. |
| 5. « ? » orphelin | Le « ? » reste collé au nom de la plante, aussi sur téléphone. |
| 6. Herbier | Vignettes de 104 px au moins (environ 120 px), catégories sur 2 colonnes dès 1 200 px, recherche sur toute la largeur. |
| 7. Progrès | 2 colonnes dès 1 200 px : Aujourd'hui et À revoir à gauche, Régularité à droite, Réglages en bas sur toute la largeur. |
| 8. Volets | Réglages : fenêtre centrée de 560 px qui apparaît en fondu. Famille du jour : carte centrée de 600 × 780 px au plus. L'Aide était déjà une fenêtre centrée. |
| 9. Fenêtre 860×900 | Elle reçoit la mise en page ordinateur (photo à gauche, réponses à droite) : plus de trou sous la photo, et les réponses ne passent plus sous la barre d'onglets. |

**Corrections communes, voulues.**
- Tablette en portrait : la photo peut prendre jusqu'à 50 % de la hauteur, contre 38 % avant. Cela supprime le trou sous la photo, aussi visible en 768×1024.
- Le « ? » des 4 photos (point 5).

**Contrôle.** `outils/controle_ordinateur.js`, sur 4 formats (860×900, 1280×650, 1440×900, 1920×1080), vérifie :
- la largeur de la colonne et l'alignement de l'en-tête ;
- le centrage du QCM et de la saisie face à la photo, la hauteur des réponses et l'absence de recouvrement par la barre d'onglets ;
- le « ? » sur la ligne du nom ;
- le nombre de colonnes de l'Herbier et de Progrès, et la taille des vignettes ;
- le centrage et la taille des fenêtres ;
- l'absence de défilement horizontal et d'erreur JavaScript.

Il vérifie aussi que le téléphone garde le volet Réglages en bas d'écran et l'en-tête de bord à bord.

**Non-régression visuelle.** J'ai comparé au pixel près les captures avant et après, sur les 7 tailles de la recette. Sur téléphone (360 à 412 px), seul l'écran 4 photos change (le « ? »). Réglages et Aide ne diffèrent que par le flou de l'écran situé derrière. En 768×1024, seule la hauteur de photo change.

Aperçus : `maquettes/p-ordi-avant.png` et `maquettes/p-ordi-apres.png` (1440×900 : QCM, saisie, 4 photos, Herbier, Progrès, Réglages).

## Ordre proposé

| Étape | Contenu | Pourquoi cet ordre |
|---|---|---|
| A | 8 · 2 · 1 · 4 | Corrections précises et peu risquées, effet immédiat. |
| B | 3 · 5 | Après ton choix A ou B pour les catégories. |
| C | 6 | Le plus long ; dessiné une seule fois aux bonnes tailles. |
| D | 7 | En dernier, pour vérifier l'ordinateur avec le rendu final de tout le reste. |

## Décisions prises (7 octobre)

1. Catégories : **option B**.
2. Illustrations : direction validée, **en moins enfantin et plus coloré**. Chaque famille d'illustrations (et chaque rang) reçoit sa propre teinte, pour que les icônes ne se ressemblent plus, tout en gardant le même trait et le même univers.
3. Garde-fou d'une seconde : validé.
4. Ordre A → B → C → D : validé.

## Décisions à prendre (état initial)

1. Catégories : **option A ou B** ? (B recommandée)
2. Illustrations : la direction « carnet naturaliste » te convient-elle, ainsi que les remplacements (laurier, étiquette, boussole, rondelle de bois) ?
3. Réponse vide : d'accord pour le garde-fou d'1 seconde ?
4. D'accord avec l'ordre A → B → C → D ?
