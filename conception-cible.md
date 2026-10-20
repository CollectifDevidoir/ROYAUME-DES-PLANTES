# Le royaume des plantes — Audit stratégique et conception cible (phase 1)

Document de référence pour les prochaines interventions. **Aucun fichier du dépôt n'a été modifié.**
État audité : branche `claude/peaceful-maxwell-0sgajy`, commit `c681ffe` (20/10/2026), `APP_V='2026.10.19'`.

## Suivi (à tenir à jour à chaque lot)

| Date | Objet | Décision ou état |
|---|---|---|
| 20/10/2026 | Décision 1, plafond des révisions | **60 jours** (proposition retenue). |
| 20/10/2026 | Décision 2, erreur sur une plante acquise (lot 1.3) | **Écartée par le concepteur** : après chaque erreur, une plante acquise revient au **niveau 3**, comme avant. Pas de mention « à raffermir », pas de plancher de rang : le rang suit les espèces acquises et peut baisser (D-03 reste ouvert). |
| 20/10/2026 | Lot 1 | **Fait** : 1.1, 1.2, 1.4, 1.5, 1.6, 1.7 (1.3 écartée). Détail ci-dessous. |

| 20/10/2026 | Ordre des lots | Le lot 2 passe avant le lot 3, **sans alourdir l'interface** : aucun bouton, aucune ligne ajoutés à l'écran. 2.3 (ligne « Sosie · Comparer ») et 2.4 (bouton d'entraînement sur les sosies) sont donc écartés ; 2.6 (photos trompeuses) est reporté. |
| 20/10/2026 | Lot 2 | **Fait** (2.1, 2.2, 2.5 prêt à recevoir l'export). Détail ci-dessous. |

| 20/10/2026 | Lot 3, cadrage | **Pas de 4e onglet communautaire** (le Profil reste un volet). **« Progrès » garde son nom.** **Pas de « Toute la flore »** : l'herbier est un pokédex qui se mérite, il ne montre que les espèces rencontrées. **La carte « Classique » reste au-dessus de Famille du jour et Défi du jour.** Les erreurs du jour ne sont **plus proposées pendant le jeu** : seulement à l'objectif atteint et dans Progrès. 3a.2, 3b.1 et 3b.2 sont donc écartés. |
| 20/10/2026 | Lot 3 | **Fait** (version réduite). Détail ci-dessous. |

**Lot 3, résultats**
- **Bouton « Rejouer mes erreurs » retiré de l'écran de jeu.** Les erreurs restent proposées à l'objectif atteint (« Revoir mes N erreurs », `goalAnim`) et dans Progrès (« Rejouer mes erreurs du jour »). `controle_entrainement` passe désormais par Progrès.
- **D-09 corrigé sans changer la disposition.** Le mode « début de séance » (la photo cède la hauteur des modes) s'appliquait seulement sous 760 px de large ; il vaut maintenant pour le téléphone et la tablette, tout sauf la mise en page ordinateur. Pendant ce mode, le plancher de la photo passe de 150 à 140 px. La recette vérifie les 4 réponses au-dessus de la barre d'onglets sur les 7 tailles, sans exception : 360×640 (6 px de dépassement avant) et 768×1024 (113 px avant) passent. La liste des défauts connus de la recette est vide.
- **À savoir.** `controle_clavier_ordi.js` (étape 7) signale 3 échecs, **identiques sur la version publiée** : il décrit l'ancienne mise en page ordinateur, remplacée depuis. `controle_ordinateur.js`, à jour, est vert. Il n'est pas dans la recette rapide ; à réécrire ou retirer un jour.

**Lot 2, résultats mesurés**
- **2.1.** `outils/sosies.js` fusionne toutes les paires déjà rédigées dans l'appli. Avant, seules les 57 `PAIRS` servaient au tirage : `NP` (38 paires) et les 61 groupes de `C` n'étaient jamais utilisés. S'y ajoutent les cousins (même genre et catégorie) et les espèces proches (même famille et catégorie, clés ressemblantes). Au plus 6 sosies par espèce, 3,1 en moyenne. Résultat : **686 espèces sur 768** ont au moins un sosie de leur catégorie (environ 440 auparavant, par le genre et les paires). Table `SO` de 13 Ko, sorties reproductibles. Les sosies « proches » ne sont relus que sur échantillon : ils ne servent qu'au tirage des mauvaises réponses, sans aucun texte affiché, donc sans affirmation botanique.
- **2.2.** Les mauvaises réponses proposées puisent d'abord dans les sosies (QCM et 4 photos). La difficulté reste progressive : une plante nouvelle chez un débutant a au plus 1 sosie parmi les mauvaises réponses, et un sosie non retenu n'est plus tiré par hasard parmi les réponses lointaines. Au niveau 3 et plus : 2 sosies parmi les 3 mauvaises réponses, 3 une fois sur dix (le mode entraînement en garde 3, c'est son but). Mesure (`controle_distracteurs.js`, mêmes sosies de référence, plusieurs milliers de tirages) : à niveau 3, **68 % des mauvaises réponses sont des sosies, contre 43 % avant** ; pour une plante nouvelle, 11 % contre 8 %. Un premier réglage montait à 94 % : le concepteur l'a jugé trop difficile et a fixé **70 % au plus** (20/10/2026), pour que les plantes restent acquérables.
- **2.5.** Il suffit de déposer `donnees/confusions-observees.csv` (requête dans `supabase/LISEZ-MOI.md`) et de relancer l'outil. Seuils : 3 joueurs et 5 fois ; synonymes reconnus. Testé sur un faux fichier : 4 paires retenues sur 6. **Aucun export réel reçu à ce jour.**
- **À surveiller.** La simulation de mémoire ne tient pas compte de la ressemblance des mauvaises réponses : l'effet sur les vrais joueurs (réussite en QCM aux niveaux 3 et plus) se lira dans les Coulisses (`par_exercice`) après publication. Une baisse de quelques points de réussite au QCM est attendue et voulue.

**Lot 1, résultats mesurés**
- **1.1 et 1.2 (D-01, D-02).** Toute bonne réponse sur une plante due la replanifie. Au niveau 6, le délai est de 7 j, doublé à chaque entretien réussi en écrivant le nom (ou en retrouvant la photo) : 14, 28, 56, puis 60 j au plus. Le compteur `p.k` est remis à zéro par une erreur. Une bonne réponse en QCM replanifie au délai en cours, sans l'allonger. Contrôle : `outils/controle_memoire.js`, 20 vérifications ; il compte 13 échecs sur la version d'avant.
- **Simulation** (`simulation_memoire.js`, variante `avant_lot1` comparée sur les mêmes joueurs simulés) :

  | Mesure | 30 jours (8 joueurs) | 90 jours (6 joueurs) |
  |---|---|---|
  | Plantes acquises, avant → après | 44,3 → 48,3 (**+9 %**) | 120,3 → 140,0 (**+16 %**) |
  | Plantes retenues une semaine après (acquises × rétention) | 32,7 → 35,9 (**+10 %**) | 103,1 → 113,2 (**+10 %**) |
  | Part des questions d'entretien | 13 % → 13 % | 29 % → **24 %** |
  | Rétention moyenne à +7 j | 73,8 → 74,4 % | 85,7 → **80,9 %** (−4,8 pts) |

  La rétention **moyenne** baisse à 90 jours : l'ancienne version faisait réviser sans fin un plus petit nombre de plantes, toujours dues. Le critère prévu (−1 point au plus) n'est donc pas tenu sur cette mesure. Deux réglages ont été essayés : QCM à demi-délai, et plafond à 30 j. Ils ne changent rien au-delà du bruit de la simulation (environ ±4 %). Le nombre de plantes réellement retenues, lui, augmente de 10 %. Une simulation reste un modèle, pas une mesure sur de vrais joueurs.
- **1.4 (D-04).** Verdict « Bon genre » (genre juste, avec ou sans faute de frappe, et espèce absente de la liste, ou genre seul), compté faux. Contrôle : `controle_saisie.js`.
- **1.5 (D-05).** Les sources des clés sont affichées pour les 768 espèces (1 368 liens, « Sources et crédits »). Le poids ajouté est de 53 Ko. Contrôle : `controle_sources_cles.js`.
- **1.6 (D-10, D-19).** La recette part de l'accueil d'un habitué et vérifie que les 4 réponses tiennent au-dessus de la barre d'onglets. Elle confirme D-09 : 6 px de dépassement à 360×640, 113 px sur tablette 768×1024, signalés « CONNU (D-09) » jusqu'au lot 3. Ajouts : `outils/recette_rapide.sh` (19 contrôles, environ 12 min) et le workflow `.github/workflows/recette.yml`.
- **1.7 (D-21).** Ce document est dans le dépôt, `outils/LISEZ-MOI.md` est à jour et `rapport-de-cloture.md` porte une note de date.

## 0. Méthode et limites

**Ce que j'ai fait réellement**
- Lecture du code de `index.html` (4 095 lignes, 1,89 Mo, 560 Ko compressé) : moteur de tirage, mémoire, correction, fiches, herbier, progrès, réglages, défi, comptes ; `supabase/schema.sql` (23 fonctions, 16 tables) ; documents `plan-de-modifications.md`, `plan-lot-2.md`, `rapport-de-cloture.md`, `analyse-reglages-aide.md`, `outils/LISEZ-MOI.md`, `supabase/LISEZ-MOI.md`.
- Exécution dans Chromium (Playwright, banc d'essai `outils/banc_essai.js`, réseau simulé) :
  - `recette.js` : **133 / 133 OK** sur les 7 tailles (360×640 → 1920×1080), captures examinées à 375×667 ;
  - `controle_defi.js` : OK ;
  - `simulation_memoire.js` : voir D-02 ;
  - trois scripts de mesure ponctuels (inventaire des données en mémoire, hauteur du premier écran, comportement de `srs()`), gardés hors du dépôt.

**Ce que je n'ai pas pu vérifier**
- Les vraies photos iNaturalist : le réseau est simulé, donc aucun jugement possible sur leur qualité ou leur cadrage.
- Le vrai Supabase : comptes, classements et défi n'ont été vus qu'à travers les tests à faux serveur.
- Un vrai iPhone ou Android (clavier, encoche, vibration).
- Les chiffres d'usage réels de `coulisses.html`. Je n'ai donc **aucune donnée sur la rétention réelle** : toute affirmation sur l'engagement est une hypothèse.

**Légende des preuves** : **[Code]** démontré par lecture du code, **[Test]** démontré par exécution, **[Visuel]** observé sur capture, **[Hyp.]** hypothèse de conception.

---

## 1. Diagnostic général

### Cinq forces

| # | Force | Preuves |
|---|---|---|
| F1 | **Un contenu botanique riche, vérifié et hiérarchisé.** | **[Test]** 768 espèces : 229 arbres, 194 arbustes, 223 vivaces, 52 grimpantes, 70 graminées. Chaque espèce a 3 à 5 clés revues (664 × 3, 90 × 4, 14 × 5, table `Q` issue de `donnees/cles-revues.csv`, sources par espèce). 768 « À découvrir » (`AS`), 523 curiosités sourcées (`CU`), 768 milieux (`ES`), 71 fiches complètes sourcées (`SD`) et 697 descriptions (`DSC`). |
| F2 | **Un moteur d'apprentissage pensé, pas un simple quiz aléatoire.** | **[Code]** `pick()` en 4 strates : ancrage à 3–6 questions (`soon`), entretien, consolidation, équilibre entre nouvelles espèces et lacunes (`gapN`). `wf()` introduit les espèces par paliers de difficulté (`lvl`, `EASY`, `CM`). `choices()` rapproche les distracteurs à mesure que la plante est connue, y compris avec **les confusions personnelles** (`st.cf`). `exType()` alterne QCM, 4 photos et saisie. Tolérance « Presque » (`near`, une faute de frappe), verdict « Même genre », 63 synonymes (`SYN`). |
| F3 | **Une correction hiérarchisée et une pédagogie de la confusion.** | **[Code / Visuel]** `showSheet()` : verdict, « À retenir » (clés numérotées), puis « Plus de détails » (portrait, conditions, « À découvrir », sources). En cas d'erreur entre deux espèces : deux colonnes, « Pour ne pas les confondre », `whyHtml()` (même genre ou famille, caractères communs), moyens mnémotechniques `MN`. Le duel `openSheet()` sert aussi à l'entraînement. |
| F4 | **Une qualité d'exécution rare et outillée.** | **[Test]** Recette 133/133 sans erreur JS. Plus de 45 scripts de contrôle : volets, clavier, ordinateur, mode sombre, cache, comptes avec PGlite et vraie bibliothèque supabase-js. Restauration validée (`checkBackup`), confidentialité explicite (Réglages > Confidentialité), file d'attente iNaturalist, index de photos mensuel (`.github/workflows/photos.yml`). |
| F5 | **Un socle communautaire déjà fonctionnel.** | **[Code / Test]** Comptes Supabase et code ami (`ajouter_ami`, 20 essais par heure). Classement d'Assiduité (jour, semaine, mois : `tableau`, `tableau_periode`). Défi du jour commun à tous, une partie par compte (`publier_defi`, `tableau_defi`), **planning de 90 jours prêt** (`DQP`, 900 questions, 10 thèmes, 620 QCM et 280 en photos). Partage façon grille 🟩🟥 (`dfTexte`). Synchronisation multi-appareils sans perte (`fusion`). Mesures anonymes et `coulisses.html`. |

### Cinq freins principaux

| # | Frein | Preuves |
|---|---|---|
| B1 | **La mémoire à long terme est plafonnée et a un défaut de replanification.** | **[Code]** `INT=[0,0,0,0,1 j,3 j,7 j]` : aucun intervalle au-delà de 7 jours. **[Test]** Dans `srs()`, une bonne réponse sur une plante acquise arrivée à échéance ne la replanifie que si son niveau change (`if(p.b!==b0\|\|!good)`). Mesure : niveau 6 et saisie juste → toujours due (−1 j) ; niveau 4 ou 5 en QCM ou en photos juste → toujours due. Ces plantes restent donc indéfiniment dans `dueL`, et `pick()` consacre jusqu'à 65 % des tirages à l'entretien. Pour quelqu'un qui a acquis 300 espèces, la découverte ralentit fortement. **[Test]** `simulation_memoire.js` : 46,5 acquises en 30 jours et 73,4 % de rétention, contre 63 et 79 % annoncés dans `rapport-de-cloture.md` (variation normale d'environ 4 %). |
| B2 | **Les confusions sont bien traitées quand elles sont connues, mais elles le sont rarement.** | **[Test]** Seules 150 espèces sur 768 ont un texte « À ne pas confondre » (`confOf`) ; 100 sont dans des paires (`PAIRS`, 57 paires) ; il y a 3 moyens mnémotechniques. Dans le jeu, 322 genres sur 444 n'ont qu'une espèce : leurs distracteurs « proches » viennent donc seulement des paires ou des confusions personnelles, sinon le tirage est lointain et le QCM devient trivial (capture 375×667 : *Iris germanica* face à *Helleborus*, *Chelidonium*, *Helenium*). **[Code]** La base collecte déjà les confusions réelles de tous les joueurs (`jeu_confusions`, vue `confusions`), mais l'appli ne les réutilise pas. |
| B3 | **Le volet social est caché et récompense le volume plutôt que la maîtrise.** | **[Code]** Profil et Amis s'ouvrent seulement par le médaillon de rang ou par une ligne en bas de Progrès (`openProfil`). Le classement d'Assiduité est « Classés par exercices » (`sbCl`) : il pousse à enchaîner, pas à retenir. Il n'y a ni lien d'invitation (le code ami se copie à la main, aucun paramètre d'URL n'est lu à part l'authentification, lignes 3952–3954) ni groupe : pas de classe ni d'atelier, alors que `supabase/LISEZ-MOI.md` décrit des requêtes « le jour d'un atelier ». Le partage du défi contient l'adresse, mais pas de quoi devenir ami. |
| B4 | **L'Herbier sert de jauge plutôt que d'outil, et la progression est éclatée.** | **[Code]** `herb()` ne montre que les espèces déjà vues ; les autres sont un compteur « + N à découvrir ». On ne consulte une espèce inconnue que par la recherche. Il n'y a de filtre ni par famille, ni par statut (à revoir), ni par milieu. La progression est répartie sur trois endroits : l'en-tête (rang et anneau), Progrès (aujourd'hui, régularité, à revoir, confusions) et Profil (frise des 15 rangs, bilan). **[Code]** Une erreur sur une plante acquise la renvoie au niveau 3 (`p.b=b0>=4?3:1`) ; `known()` et `rk()` sont recalculés à chaque fois, sans plancher. **Le rang peut donc baisser**, ce qui va contre le principe « pas trop punitif ». |
| B5 | **L'architecture est fragile pour la croissance prévue.** | **[Code]** Les données du défi sont dans le fichier (`DQP` 522 Ko, `DQ` 163 Ko, soit 36 % du fichier pour 10 questions par jour). Le fichier a été multiplié par 2,4 depuis la clôture (771 Ko → 1,89 Mo) et le CSS est passé de 67 à 119 Ko. Il n'y a pas de cache hors ligne (M8 et T7 sont reportés). Le seul workflow est `photos.yml` : **aucun test ne tourne automatiquement**. La production est publiée depuis une branche `claude/improve-html-app-e7b6o4`. La traçabilité est incomplète : les sources des clés (`cles-revues.csv`, colonne « Sources des clés ») **n'apparaissent pas dans l'appli** (0 occurrence) ; seules les 71 fiches `SD` affichent leurs sources (`srcBlock`). `rapport-de-cloture.md` est périmé (663 espèces, 771 Ko). |

---

## 2. Audit détaillé

| ID | Domaine | Constat | Preuve précise | Impact utilisateur | Décision recommandée |
|---|---|---|---|---|---|
| D-01 | Mémoire | Une bonne réponse sur une plante due ne la replanifie pas si son niveau ne change pas. | [Test] `srs()` : niveau 6, saisie → `d` reste passé ; niveaux 4 et 5, QCM ou photos → idem. | Révisions répétées pour rien sur les plantes déjà sues ; la découverte ralentit. | **Corriger (lot 1)** : replanifier après toute bonne réponse sur une plante due. |
| D-02 | Mémoire | Pas d'intervalle au-delà de 7 jours. | [Code] `INT` ; [Test] simulation 46,5 acquises / 73 %. | La charge d'entretien grandit avec la collection, aucune consolidation à long terme. | **Lot 1** : intervalles croissants au-delà de 7 jours (compteur de réussites d'entretien, plafond à arbitrer). |
| D-03 | Mémoire / motivation | Le rang peut redescendre après une erreur. | [Code] `srs` (`b0>=4?3`), `rk()` sans plancher. | Sentiment de punition, contraire au principe « Presque ». | **Écarté le 20/10/2026** (voir Suivi) : une plante acquise ratée revient au niveau 3 et le rang suit les acquises. |
| D-04 | Correction | En saisie, le bon genre suivi d'une espèce absente du jeu donne « n'est pas dans la liste ». | [Code] `answer()` : `w` n'est cherché qu'en correspondance exacte ; « Même genre » exige `w`. | Retour décourageant pour une réponse à moitié juste. | **Lot 1** : verdict « Bon genre » (compté faux, ton positif). |
| D-05 | Traçabilité | Les sources des clés « À retenir » ne sont pas affichées. | [Code] `srcBlock` ne lit que `SD` ; 0 occurrence des URL de `cles-revues.csv` dans `index.html`. | L'exigence de sources n'est pas tenue pour 697 espèces. | **Lot 1** : table compacte des sources par espèce (identifiants de domaine), affichée dans « Sources et crédits ». |
| D-06 | Distracteurs | 322 genres sur 444 n'ont qu'une espèce ; il y a peu de paires. | [Test] inventaire ; `choices()`. | QCM trop faciles une fois les débuts passés ; on apprend mal à distinguer. | **Lot 2** : sosies par espèce (paires sourcées + confusions observées), distracteurs de même famille ou d'aspect proche. |
| D-07 | Données communautaires | Les confusions réelles sont collectées mais pas réutilisées. | [Code] `jeu_confusions`, vue `confusions` ; aucun usage côté appli. | Occasion perdue : la communauté pourrait améliorer le jeu. | **Lot 2** : export périodique vers `donnees/sosies.json` (outil + workflow), relu avant publication. |
| D-08 | Fiches | « À ne pas confondre » ne concerne que 150 espèces sur 768. | [Test] `confOf`. | La rubrique la plus utile manque souvent. | **Lot 2** : pour toute paire de sosies, afficher le comparatif clé par clé (`cmpHtml` existe déjà) **sans rédiger de texte non sourcé**. |
| D-09 | Écran de jeu | En début de séance, la photo d'un habitué tombe à 150 px de haut sur 360×640. | [Test] mesure : `deb` actif, `pic` = 150 px (253 px sans les modes) ; la 4e réponse dépasse la barre d'onglets de 6 px. | Le stimulus principal (la photo) est trop petit à la première question. | **Lot 3** : modes repliés en une ligne « Classique ▾ · Défi · Famille » ; photo d'au moins 200 px à 360×640. |
| D-10 | Recette | La capture « accueil » de la recette ne montre pas le vrai premier écran. | [Test] `banc_essai` retire `fresh` après le premier tirage : `deb` n'est pas appliqué (photo de 272 px, réponses 3 et 4 sous les onglets sur la capture). | Faux sentiment de sécurité, ou fausse alerte. | **Lot 1** (outil) : charger un état d'habitué avec `state`, et vérifier que les 4 réponses sont visibles. |
| D-11 | Herbier | Les espèces non vues sont invisibles ; aucun filtre. | [Code] `herb()`. | Impossible de parcourir la flore, de préparer une sortie ou de viser une famille. | **Lot 3** : Herbier en deux modes, « Ma collection » et « Toute la flore » (silhouettes), filtres catégorie, famille et statut. |
| D-12 | Architecture des écrans | Progrès, Profil et l'en-tête se partagent la progression ; Profil est caché. | [Code] `pro()`, `ami()`, `openProfil`. | Les fonctions sociales sont peu découvertes **[Hyp., à confirmer dans Coulisses : `usages.profil`]**. | **Lot 3** : 4e onglet « Clairière » (communauté) ; Progrès devient « Carnet ». À arbitrer (§8). |
| D-13 | Social | L'Assiduité est classée au nombre d'exercices. | [Code] `sbCl` « Classés par exercices ». | Pousse à cliquer vite plutôt qu'à apprendre. | **Lot 4** : classement hebdomadaire par **pousses** (acquisitions + défi + jours joués, plafonné par jour). |
| D-14 | Social | Pas de lien d'invitation ni de groupe. | [Code] aucun paramètre `ami` ou `groupe` lu ; schéma sans table de groupe. | L'appli se propage mal (classes, ateliers, familles). | **Lot 4** : lien `?ami=RPL-…` (client et RPC existante), puis groupes (serveur). |
| D-15 | Défi | Le défi est un quiz de culture botanique (noms latins visibles sous les photos), à part de l'identification. | [Code] `dfQuestion` (`dfl` affiché dès la question), choix de conception du commit `c0162d0`. | Intéressant et varié, mais déconnecté du cœur du jeu (reconnaître sur photo). | **À arbitrer** : garder le planning de 90 jours tel quel ; envisager à partir de janvier 2027 un format 7 + 3 avec 3 photos d'identification. |
| D-16 | Défi | Le défi ne mène à rien ensuite. | [Code] `dfResultat` : partage et retour au quiz seulement. | Une occasion d'apprendre perdue. | **Lot 4** : « S'entraîner sur les plantes du défi », qui lance les espèces citées par les questions ratées. |
| D-17 | Rangs | Écarts croissants entre les rangs (80 à 120 acquises entre les rangs 10 et 15), sans récompense intermédiaire. | [Code] `R` ; [Test] simulation : environ 1,5 acquise par jour à 40 exercices. | Longs passages sans gratification (environ 2 mois entre deux rangs hauts). **[Hyp.]** | **Lot 5** : collections (familles complètes, thèmes : haie champêtre, plantes de terrain sec…) comme jalons. |
| D-18 | Performance | Fichier de 1,89 Mo, dont 685 Ko pour le défi. | [Code] tailles des lignes 2376 et 2377. | Premier chargement lent sur réseau mobile. **[Hyp. sans mesure réelle]** | **Lot 6** : sortir `DQ` et `DQP` dans `donnees/defis.json`, chargé à l'ouverture du défi (garder une série de secours dans le fichier pour `file://`). |
| D-19 | Fiabilité | Aucun test automatique sur les modifications. | [Code] `.github/workflows/` ne contient que `photos.yml`. | Une régression peut partir en production. | **Lot 1** : workflow « Recette » (recette et contrôles rapides) sur chaque push et chaque PR. |
| D-20 | Fiabilité | La production est publiée depuis une branche `claude/…` ; l'index des photos y pousse directement. | [Code] `photos.yml` (`ref: claude/improve-html-app-e7b6o4`), `supabase/LISEZ-MOI.md`. | Conflits entre sessions, risque de publier un travail en cours. | **À arbitrer** : branche `main` de publication, développement sur branches et PR. |
| D-21 | Documentation | Le rapport de clôture et `outils/LISEZ-MOI.md` sont en partie périmés (663 espèces ; outils absents `controle_ids.py`, `controle_parcours.py`, `export_donnees.py`). | [Code] fichiers. | Les prochaines interventions risquent de repartir de chiffres faux. | **Lot 1** : ajouter ce document au dépôt (`conception-cible.md`) ; mettre les chiffres à jour. |
| D-22 | Hors ligne | Pas de service worker ; les photos et les descriptions Wikipédia dépendent du réseau. | [Code] `descr()` interroge Wikipédia en direct ; pas de `serviceWorker`. | L'appli est inutilisable en sortie de terrain sans réseau. | **Lot 6** : cache hors ligne du fichier, des polices et des photos déjà vues. |
| D-23 | Correction | Bonne base : verdicts gradués, photo nette, fiche qui défile seule. | [Test] `controle_fige`, captures. | — | **Conserver.** |
| D-24 | Réglages et aide | Option D en place, objectif de 10 à 100, sauvegarde validée. | [Code] `setHtml`, `checkBackup`. | — | **Conserver** (seule la porte d'entrée change si l'onglet Clairière est adopté). |

---

## 3. Vision cible

**Positionnement.** Le carnet de terrain ludique pour **reconnaître durablement** les arbres, arbustes et vivaces des jardins et des villes. On apprend seul en quelques minutes par jour, et on progresse ensemble : entre amis, en classe ou en atelier.

**Promesse.** « Chaque jour, quelques minutes ; chaque plante apprise reste dans ton herbier, et tu sais pourquoi tu la reconnais. »

**Principes d'expérience** (chacun avec son critère)

1. **La photo d'abord.** Le stimulus visuel domine chaque question : au moins 200 px de haut à 360×640, 4 réponses visibles sans défilement.
2. **Comprendre avant de retenir.** Toute correction montre en moins de 3 secondes « Ce qu'il faut regarder » (3 à 5 clés), puis le détail à la demande. Toute erreur entre deux espèces affiche leur comparaison.
3. **Indulgent, jamais punitif.** « Presque », « Même genre », « Bon genre » ; le rang ne baisse jamais ; une série tolère un jour de repos par semaine.
4. **Ce qui est appris se garde.** Révisions espacées au-delà d'un mois ; l'herbier rend visible ce qui est solide et ce qui est à raffermir.
5. **Rien d'inventé.** Chaque caractère affiché est sourcé ou vient d'une donnée vérifiée. Ce qui manque est dit (« Description à compléter »), jamais comblé.
6. **Le social sert l'apprentissage.** On compare des pousses (plantes apprises, défis réussis), pas des clics. On partage pour inviter ou défier, jamais pour exposer ses données.

**Arbitrages assumés**

| Tension | Choix |
|---|---|
| Attractivité ↔ apprentissage | Récompenser la maîtrise (acquisitions, rétention), pas le volume. Les animations restent brèves (moins de 1,2 s) et ne bloquent pas la suite. |
| Simplicité ↔ communauté | Un 4e onglet est justifié par la stratégie (le social devient un pilier visible), mais il reste léger : un défi, un classement, des amis. Les Réglages ne deviennent pas un onglet. |
| Communauté ↔ vie privée | On garde les règles actuelles (pseudo et chiffres seulement, codes volontaires). Les groupes sont fermés, par code, sans annuaire public. |
| Richesse ↔ poids | Les données lourdes et rarement lues (défi, détails) sont chargées à la demande ; le cœur du jeu reste dans un seul fichier, ouvrable tel quel. |

### Direction artistique

| Élément | Conserver | Moderniser | Refondre |
|---|---|---|---|
| Palette | Verts de forêt (`#2f6b3f`), papier clair, mode sombre | Formaliser des **jetons** : `--foret`, `--mousse`, `--papier`, `--ecorce`, `--or` (rangs), `--alerte`. Une seule teinte par rôle : juste (vert), presque (ocre), raté (brique). | — |
| Typographie | Newsreader 600 (titres et chiffres), Newsreader italique (noms latins), Atkinson Hyperlegible Next (texte) | Échelle fixe : 12 / 14 / 16 / 20 / 28 / 40 | — |
| Illustrations | Vignettes ludiques v2 (formes pleines, deux tons) : le style sépia a été rejeté le 7 octobre | Un jeu de **collections** dans le même style (badges de famille, de saison, de milieu) | — |
| Rangs | Les 15 rangs et leurs illustrations des saisons | Rang = **acquis définitif** ; anneau doré d'avancement ; jalon de collection entre deux rangs | — |
| Photos | Coins arrondis, carrousel, crédit « © » | **Étiquette d'organe** (Feuillage, Fleurs, Écorce) toujours visible en correction ; cadrage uniforme (`object-fit:cover` en 4:3, dans un cadre fixe) | — |
| Cartes de fiche | Hiérarchie « À retenir » → « Plus de détails » | Renommer « À retenir » en **« Ce qu'il faut regarder »**, pictogramme d'organe devant chaque clé quand l'organe est identifiable (feuille, fleur, fruit, écorce, port). Ajouter « Sosies » | — |
| Herbier | Catégories en cartes | **Planches d'herbier** : vignette sur papier avec étiquette (nom latin, famille, date d'acquisition) | Grille « Toute la flore » avec silhouettes pour l'inconnu |
| Mouvement | Halo `pop`, feuilles `envol`, `prefers-reduced-motion` respecté | Une seule célébration par question ; file `celQ` conservée | — |

---

## 4. Architecture cible

| Écran | Rôle | Actions principales | Va vers |
|---|---|---|---|
| **Quiz** (onglet 1) | Apprendre et réviser | Répondre, choisir un mode (ligne repliée), Défi, Famille du jour, rejouer les erreurs | Correction, Fiche, Défi |
| ↳ Correction (volet) | Comprendre la réponse | Verdict, « Ce qu'il faut regarder », Sosies (si erreur), Plus de détails, Suivante | Fiche complète, Duel |
| ↳ Défi du jour (carte) | Rendez-vous commun | 10 questions, résultat, partage-invitation, entraînement sur le défi | Clairière (classement) |
| **Herbier** (onglet 2) | Collection et consultation | Ma collection / Toute la flore, filtres (catégorie, famille, statut : solide, à raffermir, à revoir), recherche | Fiche, Entraînement ciblé |
| ↳ Fiche (fenêtre) | Référence d'une espèce | Ce qu'il faut regarder, Sosies, Portrait, Conditions, À découvrir, Sources | Duel, S'entraîner sur cette plante |
| **Carnet** (onglet 3, l'ancien Progrès) | Mon parcours | Aujourd'hui, régularité, à revoir, confusions, rangs et collections | Entraînement, Réglages |
| **Clairière** (onglet 4, nouveau) | Communauté | Défi du jour entre amis, classement des pousses de la semaine, amis, groupes, inviter | Défi, Profil |
| Réglages (volet) | Rare | Inchangé (option D), ouvert depuis le Carnet et l'anneau | — |
| Aide « ? » | Premiers jours | Inchangée | — |

**Ce qui disparaît ou fusionne** : la ligne « Profil & Amis » de Progrès (remplacée par l'onglet). La frise des rangs quitte le Profil pour le Carnet. Le médaillon ouvre le **Carnet**, plus le Profil.

---

## 5. Parcours prioritaires

### 5.1 Session de quiz (habitué, téléphone)
1. Ouverture : en-tête (rang, anneau). La ligne des modes est repliée sur une hauteur ; la photo fait au moins 200 px ; les 4 réponses sont visibles.
2. Tirage : `pick()` inchangé dans sa structure. L'entretien ne retient que les plantes **vraiment** dues (D-01) ; les distracteurs viennent d'abord des **sosies** (D-06).
3. Réponse : verdict immédiat. « Juste », « Presque » et « Bon genre » ont leur propre teinte ; la vibration est inchangée.
4. Correction, à mi-écran : « Ce qu'il faut regarder ». En cas d'erreur : les deux colonnes, puis « Sosies : ce qui les sépare » (clés face à face), sans texte inventé.
5. « Plante suivante » : la question suivante est déjà préparée (`pre=prepare()`).
6. Objectif atteint : une seule célébration, puis « Revoir mes erreurs (n) » ou « Continuer ».
**Réussite** : temps entre deux questions de 2 s au plus quand la photo est en cache ; aucun écran sans action possible.

### 5.2 Consultation d'une fiche
1. Herbier > Toute la flore > filtre « Rosaceae » > vignette, ou recherche.
2. Fiche : photo, noms et famille, puis **Ce qu'il faut regarder** (clés avec pictogramme d'organe), **Sosies** (2 au plus, avec « Comparer »), puis « Plus de détails » (portrait, conditions, À découvrir, Sources : clés, fiche, photos).
3. Actions : « S'entraîner sur cette plante et ses sosies » (6 questions), « Comparer » (duel).
**Réussite** : les clés sont visibles sans défilement à 360×640 ; chaque clé est rattachée à une source consultable.

### 5.3 Révision
1. Carnet > « À revoir » (lacunes et plantes à raffermir), ou Herbier > filtre « À raffermir ».
2. Si deux espèces dominent, le duel s'affiche d'abord (comportement actuel de `startReplay`).
3. Entraînement de N questions, bandeau `trn`, réponses hors objectif (comportement actuel).
4. Fin : bilan « 4 raffermies sur 6 » ; les plantes réussies quittent la liste.
**Réussite** : une plante réussie en entraînement sort de « À revoir » (déjà le cas pour `tm.l`, à étendre).

### 5.4 Défi communautaire
1. Quiz > « Défi du jour » (pastille), ou Clairière > Défi.
2. 10 questions (planning de 90 jours inchangé), correction expliquée et sourcée.
3. Résultat : score, grille, classement entre amis, **« S'entraîner sur les plantes de ce défi »**, « Partager et inviter » : le texte contient le lien `…/?ami=RPL-XXXX&defi=AAAA-MM-JJ`.
4. Un ami ouvre le lien : il joue le défi **sans compte** et voit son score. On lui propose ensuite « Crée un compte pour te comparer à Antoine » ; une fois le compte créé, l'amitié est ajoutée automatiquement par la RPC `ajouter_ami`, qui existe déjà.
**Réussite** : nombre de comptes créés depuis un lien d'invitation (mesure `usages`) ; aucune donnée exposée sans compte.

---

## 6. Priorités produit

| # | Évolution | Impact | Effort | Dépendances | Risque de régression |
|---|---|---|---|---|---|
| P1 | Replanification et intervalles longs (D-01, D-02) | **Très fort** (cœur pédagogique) | S | — | Moyen : progressions existantes, `fusion`, `checkBackup` → migration douce et simulation |
| P2 | « Bon genre » (D-04) ; rang non régressif écarté | Fort (plaisir) | S | P1 | Faible |
| P3 | Sources des clés affichées (D-05) | Moyen (confiance) | S | `cles_vers_appli.py` | Faible (poids d'environ 40 Ko) |
| P4 | Tests automatiques et recette corrigée (D-10, D-19) | Fort (fiabilité) | S | — | Nul |
| P5 | Sosies et distracteurs (D-06 à D-08) | **Très fort** | M (données) | outil d'export, relecture | Moyen : difficulté des QCM → `controle_equilibre_modes`, simulation |
| P6 | Premier écran de jeu (D-09) | Moyen | S | — | Moyen : `controle_fige`, `controle_categories` |
| P7 | Herbier « Toute la flore », filtres, planches (D-11) | Fort | M | — | Faible à moyen (`controle_herbier`) |
| P8 | Onglet Clairière, Carnet (D-12) | Fort (social) | M | décision §8 | Moyen : volets, ordinateur, clavier |
| P9 | Lien d'invitation, défi sans compte, entraînement après le défi (D-14, D-16) | **Très fort** (propagation) | S à M | RPC existante | Faible |
| P10 | Classement des pousses (D-13) | Moyen | M | **serveur** : nouvelle RPC | Faible (`controle_comptes`) |
| P11 | Groupes et ateliers | Fort (classes) | L | **serveur** : tables `groupes`, `membres`, RPC, RLS | Moyen (sécurité) |
| P12 | Défi en fichier séparé, hors ligne (D-18, D-22) | Moyen | M | — | Moyen : `file://`, `controle_defi*` |
| P13 | Collections et jalons (D-17) | Moyen | M | P7 | Faible |

**Propositions originales retenues** (au-delà de l'existant)
- **Sosies de la communauté** : chaque mois, les confusions réelles les plus fréquentes (`jeu_confusions`) deviennent des paires de distracteurs et une carte « Sosie du mois » dans la Famille du jour. La communauté améliore le jeu sans saisir le moindre texte.
- **Duel par lien, sans serveur** : « Défie un ami sur mes 10 plantes ». La graine et la catégorie sont dans l'URL (`?duel=…`), le tirage est déterministe et chacun voit la même série. Rien à stocker ; les scores se partagent par texte.
- **Herbier vivant** : à l'acquisition, la plante devient une planche datée (`p.a`) ; revenir la raffermir « ravive » la planche. La mémoire est rendue visible et appartient au joueur.
- **Pousse collective** (avec groupe) : objectif commun de la semaine (« 300 plantes acquises par la classe »), barre partagée, sans classement individuel. Utile en atelier, sans pression.
- **Série indulgente** : un jour sans jeu par semaine ne casse pas la série ; affiché comme « jour de repos », pas comme un échec.

---

## 7. Plan d'exécution

Règles inchangées : un lot à la fois, validation avant le suivant, recette et contrôles à chaque lot, liste « ce que je n'ai pas pu vérifier ».

### Lot 1 — Mémoire fiable, verdicts indulgents, sources, garde-fous (proposé en premier)
| Tâche | Changement | Critère d'acceptation |
|---|---|---|
| 1.1 | `srs()` : toute bonne réponse sur une plante de niveau 4 ou plus **arrivée à échéance** la replanifie, que son niveau change ou non. | Test unitaire dans le navigateur : les 6 cas mesurés ci-dessus donnent une échéance future. |
| 1.2 | Intervalles croissants : au niveau 6, compteur `p.k` de réussites d'entretien, intervalle de 7 j × 2^k plafonné (plafond à arbitrer, par défaut 60 j). Pas de nouveau niveau, donc `checkBackup` (b ≤ 6) reste valide. | `simulation_memoire.js` avant et après, même graine : acquises en 30 jours ≥ actuel, rétention à +7 j ≥ actuel −1 pt, part d'entretien plafonnée. Tableau joint. |
| 1.3 | **Écartée le 20/10/2026** (voir Suivi). Proposition d'origine : rang non régressif : `st.rmax` ; l'en-tête affiche `max(rk(), rmax)`. Une plante acquise ratée affiche « à raffermir » sans quitter la collection : à arbitrer, sinon seul le rang est protégé. | Après une erreur sur une plante acquise, le rang affiché est inchangé ; test ajouté à `controle_rangs.js`. |
| 1.4 | Saisie : genre juste + espèce absente → verdict « Bon genre » (compté faux), avec les clés de l'espèce attendue. | `controle_saisie.js` : nouveau cas. |
| 1.5 | Sources des clés : `cles_vers_appli.py` génère une table compacte (domaines et URL) ; « Sources et crédits » l'affiche pour toutes les espèces. | 768 espèces sur 768 avec au moins une source affichée ; poids ajouté ≤ 60 Ko. |
| 1.6 | Recette : premier écran d'habitué réel (`state`) ; vérifier que les 4 réponses sont visibles. Nouveau workflow « Recette » (recette, `controle_fige`, `controle_saisie`, `controle_defi`, `controle_niveaux`) sur push et PR. | Le workflow passe au vert sur la branche ; il échoue si on réintroduit volontairement D-01 (test de mutation manuel). |
| 1.7 | Ajouter ce document au dépôt (`conception-cible.md`) et corriger les chiffres périmés de `outils/LISEZ-MOI.md`. | Les chiffres du document correspondent à l'inventaire. |

**Non-régression du lot 1** : recette 133/133 ; `controle_niveaux`, `controle_entrainement`, `controle_jeu`, `controle_rangs`, `controle_reglages` (restauration d'une ancienne sauvegarde sans `p.k` ni `rmax`), `controle_comptes` (fusion de deux appareils, l'un ancien, l'autre nouveau) ; aucune erreur JS.

### Lot 2 — Sosies et distracteurs
- Outil `outils/sosies.py` : il fusionne les paires sourcées (`PAIRS`, `C`, `NP`, `SD.confusions`) et les confusions observées (export CSV de la vue `confusions`, seuil minimal de joueurs différents), puis produit `donnees/sosies.json` relu à la main.
- `choices()` et `photoSet()` puisent d'abord dans les sosies, puis dans la même famille et la même catégorie.
- La fiche et la correction ajoutent une rubrique « Sosies » : comparaison des clés `Q` face à face, sans texte rédigé.
- **Critères** : au moins 500 espèces avec au moins un sosie ; taux de réussite simulé au QCM de niveau 3 ou plus entre 65 et 80 % ; `controle_equilibre_modes` vert.

### Lot 3 — Architecture des écrans
- Ligne des modes repliée (D-09), Herbier « Ma collection / Toute la flore » et filtres (D-11), Progrès renommé Carnet avec les rangs, onglet Clairière (si validé).
- **Critères** : photo d'au moins 200 px à 360×640 en début de séance ; 4 onglets de 44 px ou plus à 320 px ; `controle_ordinateur`, `controle_volets`, `controle_herbier` et `controle_categories` adaptés et verts ; captures téléphone avant et après jointes.

### Lot 4 — Communauté (côté client d'abord)
- Lien `?ami=` (ajout après connexion), défi jouable sans compte depuis un lien, « S'entraîner sur ce défi », texte de partage avec l'invitation.
- **Puis côté serveur** : RPC `tableau_pousses` (semaine), tables `groupes` et `membres_groupe` avec RLS, RPC `rejoindre_groupe`, `tableau_groupe`, pousse collective.
- **Critères** : `controle_supabase_sql` étendu (un non-membre ne voit rien d'un groupe ; 20 essais par heure aussi pour les codes de groupe) ; `controle_comptes` (invitation de bout en bout sur deux appareils).

### Lot 5 — Identité et récompenses
- Jetons de couleur, planches d'herbier, collections, série indulgente, étiquettes d'organe.
- **Critères** : `controle_illustrations`, `controle_noir`, contraste AA (4,5:1 pour le texte) en clair et en sombre.

### Lot 6 — Technique
- `donnees/defis.json` chargé à la demande, avec une série de secours dans le fichier ; service worker (fichier, polices, photos vues) ; branche de publication.
- **Critères** : `index.html` ≤ 1,25 Mo ; défi jouable hors ligne s'il a été préchargé ; `controle_defi_planning` et `controle_defi_compte` verts ; ouverture en `file://` sans erreur.

---

## 8. Décisions à arbitrer

1. **[Tranché : 60 j]** **Plafond des révisions** (lot 1.2) : 30, 60 ou 90 jours ? Je recommande 60 jours : assez long pour la mémoire à long terme, assez court pour suivre les saisons.
2. **[Tranché : retour au niveau 3, comportement actuel]** **Erreur sur une plante acquise** : (a) elle reste acquise, marquée « à raffermir » (recommandé, non punitif) ; (b) elle redescend au niveau 3 et ne compte plus comme acquise (comportement actuel), seul le rang étant protégé.
3. **Quatrième onglet « Clairière »** : oui (recommandé, le social devient visible), ou bien le social reste dans le Profil et l'on n'ajoute que le lien d'invitation.
4. **Public prioritaire** : élèves en paysage et horticulture (noms latins, saisie exigée : état actuel), ou grand public (QCM avec le nom français sous le nom latin, saisie facultative). Ce choix décide des libellés du QCM et du poids de la saisie.
5. **Défi du jour après le 18/01/2027** : garder le quiz de culture pur, ou passer à 7 questions de culture + 3 d'identification sur photo.
6. **Branche de publication** : passer à `main`, avec développement par PR et tests automatiques (recommandé), ou garder la branche actuelle.
7. **Groupes** : faut-il un rôle « animateur » (qui voit les chiffres agrégés de son groupe) ? Cela touche à la confidentialité.

---

## Premier lot proposé

**Lot 1 — Mémoire fiable, verdicts indulgents, sources et garde-fous** (tâches 1.1 à 1.7 ci-dessus).
Pourquoi d'abord : il corrige un défaut **démontré** au cœur pédagogique (D-01, D-02), il est petit, presque invisible à l'écran et mesurable par la simulation existante, et il installe les tests automatiques qui protègeront tous les lots suivants.

J'attends ta validation explicite, et tes réponses aux décisions 1 et 2, avant de toucher au code.
