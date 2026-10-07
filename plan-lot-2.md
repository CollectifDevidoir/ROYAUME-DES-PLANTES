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

## Ordre proposé

| Étape | Contenu | Pourquoi cet ordre |
|---|---|---|
| A | 8 · 2 · 1 · 4 | Corrections précises et peu risquées, effet immédiat. |
| B | 3 · 5 | Après ton choix A ou B pour les catégories. |
| C | 6 | Le plus long ; dessiné une seule fois aux bonnes tailles. |
| D | 7 | En dernier, pour vérifier l'ordinateur avec le rendu final de tout le reste. |

## Décisions à prendre

1. Catégories : **option A ou B** ? (B recommandée)
2. Illustrations : la direction « carnet naturaliste » te convient-elle, ainsi que les remplacements (laurier, étiquette, boussole, rondelle de bois) ?
3. Réponse vide : d'accord pour le garde-fou d'1 seconde ?
4. D'accord avec l'ordre A → B → C → D ?
