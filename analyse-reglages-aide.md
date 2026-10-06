# Où placer « Réglages » et « Comment ça marche » ?

Analyse de l'étape 3.1. **Rien n'est construit** : les images de `maquettes-reglages-aide.png` sont faites à partir de l'appli réelle avec des éléments ajoutés à la main. Je construis (étape 4) l'option que tu choisis.

## Ce qu'il y a déjà et ce qu'on veut ajouter

- **En-tête** : médaille, rang et barre, anneau d'objectif, bouton « ? » (aide). À 360 px de large, il est déjà dense.
- **Barre du bas** : 3 onglets (Quiz, Herbier, Progrès), dans la zone du pouce.
- **Progrès** : contient aujourd'hui la carte « Sauvegarde ».
- **À ajouter** : un volet **Réglages** (objectif quotidien réglable, vibration, sauvegarde / restauration, réinitialisation), et une **frise des niveaux** dans « Comment ça marche ».

Constats qui guident le choix :
1. Les réglages servent rarement (quelques fois dans la vie de l'appli) ; l'objectif quotidien est le seul réglage qu'on peut vouloir retoucher.
2. L'aide sert surtout les premiers jours, et le « ? » est un repère que les débutants connaissent.
3. Le coin haut droit est la zone la plus difficile à atteindre d'une main ; la barre du bas est la plus facile.
4. La frise des niveaux explique la progression : elle a plus de sens près des chiffres de progression.
5. Tu veux **ne pas alourdir** l'interface : ce qui est toujours visible compte plus que ce qui est caché derrière un geste.

## Les quatre options (voir l'image)

| | Option | Ce qui change à l'écran |
|---|---|---|
| **A** | Engrenage à côté du « ? » | Un deuxième petit bouton en haut à droite ; l'aide et les réglages restent séparés. |
| **B** | 4e onglet « Réglages » | La barre du bas passe à 4 onglets ; la page regroupe aide et réglages. |
| **C** | Un seul bouton (engrenage) | Le « ? » disparaît ; un volet « Aide et réglages » contient la frise puis les réglages. |
| **D** | Dans Progrès | Aucun élément ajouté en haut ni en bas : deux lignes en bas de Progrès (« Réglages », « Comment ça marche »). Le « ? » reste en haut. Un toucher sur l'anneau d'objectif ouvre directement les réglages. |

## Évaluation (1 = mauvais, 5 = très bon, avis argumenté et non mesuré)

| Critère | A | B | C | D |
|---|---|---|---|---|
| Légèreté (rien de nouveau en permanence à l'écran) | 3 | 2 | 4 | 5 |
| Accès au pouce | 1 | 5 | 1 | 4 |
| Découverte par un débutant | 4 | 5 | 3 | 3 |
| Cohérence avec la logique de l'appli | 3 | 2 | 2 | 5 |
| Coût et risque de construction | 4 | 3 | 3 | 5 |
| **Total** | **15** | **17** | **13** | **22** |

Pourquoi ces notes :
- **A** ajoute un bouton dans l'endroit le plus chargé et le moins accessible. Deux icônes rondes voisines (« ? » et engrenage) se confondent vite.
- **B** est le plus facile à trouver et à atteindre, mais un onglet annonce un usage fréquent : « Réglages » se retrouve au même rang que Quiz, Herbier et Progrès, qui sont les trois façons d'apprendre. Il rend aussi la barre permanente plus dense (4 × 84 px sur 360).
- **C** allège l'en-tête, mais mélange deux idées (comprendre le jeu, régler l'appli) dans un volet long, et supprime le « ? » que les débutants cherchent.
- **D** ne rajoute rien à l'écran de jeu. Les réglages se trouvent à un endroit logique (« ma progression et mon compte »), à côté de la carte « Sauvegarde » qui y est déjà. Seul point faible : un utilisateur qui n'ouvre jamais Progrès ne les verra pas, ce qui est acceptable puisqu'il n'en a pas besoin ; le toucher sur l'anneau compense pour l'objectif.

## Recommandation : option D, avec l'aide gardée en haut

1. **« Comment ça marche » ne change pas de place** : le « ? » reste dans l'en-tête, où les débutants le cherchent. On enrichit son contenu (frise des niveaux 1-2-3 apprentissage, 4 acquise, 5-6 entretien) et on le remplace dans Progrès par une simple ligne vers le même contenu.
2. **« Réglages » = un volet à ouvrir depuis Progrès** (ligne en bas) **ou en touchant l'anneau d'objectif**. Les deux gestes ouvrent le même volet : pas de deuxième écran à maintenir.
3. **Contenu du volet** (4 blocs, dans l'ordre d'usage) : objectif par jour (20 / 30 / 40 / 60, 40 par défaut), vibration (activée par défaut), sauvegarde (copier / restaurer), réinitialisation (avec confirmation).
4. **Le volet se présente comme le volet de correction** (même grip, mêmes marges, mêmes séparations fines) pour que l'utilisateur le reconnaisse d'emblée.
5. **Premier lancement** : le bandeau « Bienvenue » mentionne le « ? » pour l'aide. Il n'a pas besoin de mentionner les réglages.

## Ce qu'il me faut de toi

- Choisir **D** (recommandé), ou une autre option, ou une variante (par exemple D avec l'engrenage en plus dans l'en-tête).
- Dire si le « ? » doit rester **exactement** où il est (c'est ce que je propose).

Étape 4 ensuite : volet Réglages, frise des niveaux, objectif réglable, vibration, sauvegarde et réinitialisation déplacées, import validé.
