# Prompt à donner à ChatGPT

Joindre au message l'image `planche-actuelle.png` (les illustrations actuelles, avec le nom attendu sous chacune), puis coller tout le texte ci-dessous.

---

Tu es directeur artistique et illustrateur. Tu redessines les 37 illustrations d'une application web de reconnaissance des plantes, « Le Royaume des Plantes ». Elle sert à des paysagistes, des jardiniers et des étudiants en botanique. L'image jointe montre les dessins actuels : elle te donne ce que chaque dessin représente et son nom de fichier. Ne copie pas leur style.

## Le diagnostic

Les dessins actuels sont propres mais génériques : on pourrait les trouver dans n'importe quelle application. Je veux qu'on reconnaisse au premier coup d'œil un carnet de naturaliste, pas une banque d'icônes.

## La direction artistique

À rechercher :
- **un trait manuel** : un contour d'encre légèrement irrégulier, d'épaisseur variable, qui s'interrompt parfois. Pas de contour parfait au compas ;
- **des formes organiques** : légère asymétrie, feuilles et troncs qui ont du caractère, rien de géométrique ou de symétrique au pixel près ;
- **une inspiration naturaliste** : planches d'herbier, carnet botanique, aquarelle sobre posée en aplats, ambiance de sous-bois ;
- **de la simplicité** : la silhouette d'abord. Chaque dessin doit se lire en un coup d'œil, même minuscule ;
- **une vraie singularité** : une petite idée graphique propre à la série (un geste de trait, une façon de poser la couleur légèrement à côté du contour comme une aquarelle rapide, une petite étiquette d'herbier, etc.), appliquée avec constance à tous les dessins.

À éviter :
- les pictogrammes « startup » : formes lisses, dégradés, style flat générique ;
- le style enfantin : visages, yeux, sourires, formes gonflées, couleurs bonbon ;
- les micro-détails inutiles, la surcharge, les hachures partout (2 à 4 traits de hachure au plus par dessin, seulement s'ils aident à lire le volume) ;
- les effets « jeu vidéo » : brillances, éclats, contours lumineux.

Le ton général de l'application est chaleureux, légèrement malicieux, jamais enfantin. Les dessins doivent former une seule famille : même trait, même palette, même échelle, même ligne de sol.

## La palette

Seize couleurs au plus pour toute la série. Pars de celle-ci (tu peux ajuster les teintes, pas en ajouter beaucoup) :

| rôle | couleur |
|---|---|
| encre (contours) | `#2b3a2e` |
| mousse (vert profond) | `#3f6f3a` |
| vert feuille | `#6f9f55` |
| sauge (vert clair) | `#a9c98e` |
| vert tendre (reflets) | `#d3e6bf` |
| écorce | `#7a5235` |
| écorce claire / bois | `#b08a63` |
| terre | `#9c6b45` |
| papier / crème | `#f4ecd8` |
| ocre / or | `#d9a441` |
| rouge baie | `#b8463a` |
| rose fleur | `#d98a9b` |
| violet fleur | `#7d6aa8` |
| bleu eau / ciel | `#5d93b8` |
| nuit | `#34406b` |

Ces dessins s'affichent aussi en **mode sombre**, sur un fond `#1a2a1e`. Les aplats doivent suffire à lire la forme sur fond sombre : le trait d'encre est un accent, il ne doit jamais être le seul porteur de la silhouette.

## Les tailles d'affichage

- Les **rangs** s'affichent en 40 à 56 px dans l'en-tête, et en 140 px dans l'animation de passage de rang.
- Les **catégories** et les **onglets** s'affichent en 20 à 32 px.
- Les **pictos** s'affichent en 14 à 28 px, parfois au milieu d'une ligne de texte. Ce sont les plus simples de la série.

Vérifie chaque dessin à 20 px : s'il devient illisible, simplifie-le.

## Ce que chaque dessin représente

### Rangs (12)

La progression du joueur, de la graine au maître du royaume. La série doit raconter une croissance et monter en richesse de façon visible : rang 1 très sobre, rang 12 le plus précieux, sans jamais devenir clinquant. Garde l'idée de chaque rang, réinvente le dessin.

| fichier | rang | idée |
|---|---|---|
| `rangs/01-graine` | Graine | un gland ou une graine, seul |
| `rangs/02-germe` | Germe | deux cotylédons qui sortent de terre |
| `rangs/03-pousse` | Pousse | une petite tige à quelques feuilles |
| `rangs/04-jeune-plant` | Jeune plant | un jeune plant en pot de terre cuite |
| `rangs/05-arbrisseau` | Arbrisseau | un petit buisson fleuri, plusieurs tiges depuis la base |
| `rangs/06-jeune-arbre` | Jeune arbre | un arbre grêle, tronc fin, petit houppier |
| `rangs/07-arbre` | Arbre | un arbre adulte, avec fruits |
| `rangs/08-grand-chene` | Grand chêne | un chêne large et puissant, aux couleurs d'automne |
| `rangs/09-bosquet` | Bosquet | trois arbres groupés |
| `rangs/10-foret` | Forêt | une lisière de conifères et de feuillus |
| `rangs/11-gardien-de-la-foret` | Gardien de la forêt | un arbre dans un médaillon de nuit étoilée, avec un croissant de lune |
| `rangs/12-maitre-du-royaume` | Maître du royaume | un arbre doré et majestueux, une petite couronne de feuillage ou d'or |

### Catégories (5)

Ces dessins doivent être **botaniquement justes**, car le public les connaît bien :

| fichier | sens | ce qui doit se voir |
|---|---|---|
| `categories/arbre` | arbre | un seul tronc net, un houppier |
| `categories/arbuste` | arbuste | plusieurs tiges ligneuses partant du sol, pas de tronc unique |
| `categories/vivace` | plante vivace | une plante herbacée en fleur (tige souple, feuilles, une fleur), rien de ligneux |
| `categories/grimpante` | plante grimpante | une tige qui s'enroule autour d'un tuteur, avec quelques feuilles |
| `categories/graminee` | graminée | une touffe de feuilles fines et arquées, avec des épis ou des panicules légers. Surtout pas de « fleurs » en forme de tulipe, c'est le défaut du dessin actuel |

### Onglets (3)

| fichier | sens |
|---|---|
| `onglets/quiz` | Quiz : une feuille de chêne bien dessinée |
| `onglets/herbier` | Herbier : un herbier ou carnet ouvert, avec une feuille pressée |
| `onglets/progres` | Progrès : une rondelle de tronc avec ses cernes, une petite pousse qui en sort |

### Pictos (14)

| fichier | sens |
|---|---|
| `pictos/famille-du-jour` | Famille du jour : une étiquette ou planche d'herbier avec un brin de plante |
| `pictos/rejouer-erreurs` | Rejouer mes erreurs : une boussole (retrouver son chemin) |
| `pictos/indice` | Indice / joker : une loupe sur une feuille |
| `pictos/trophee` | Objectif du jour atteint : une couronne de laurier avec une médaille |
| `pictos/profil` | Profil & amis : deux pousses côte à côte |
| `pictos/reglages` | Réglages : un engrenage, avec une touche végétale discrète |
| `pictos/serie-flamme` | Jours de suite : une petite flamme |
| `pictos/acquise-etincelle` | Plante acquise (moment de réussite) : une étincelle |
| `pictos/acquise-coche` | Plante acquise : une coche tracée à la main |
| `pictos/soleil` | Exposition au soleil |
| `pictos/sol` | Type de sol : une motte de terre |
| `pictos/eau` | Besoin en eau : une goutte |
| `pictos/ph` | pH du sol : une éprouvette ou un tube de test |
| `pictos/froid` | Résistance au froid : un flocon |

## Le format technique, à respecter à la lettre

Les dessins seront collés automatiquement dans une seule page web. Sans ces règles, ils ne peuvent pas être intégrés.

1. **Du SVG vectoriel écrit en code**, pas une image générée. N'utilise pas ton générateur d'images : je n'ai pas besoin d'une image, mais d'un code SVG qui dessine la forme.
2. Chaque dessin est **un seul élément `<svg>`** qui commence exactement ainsi :
   `<svg data-nom="rangs/01-graine" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">`
   La valeur de `data-nom` est celle des tableaux ci-dessus, sans extension.
3. Le dessin occupe le carré de 64 × 64 avec **3 unités de marge** sur chaque bord. Les dessins posés au sol ont leur sol vers **y = 58**. Une petite ombre au sol est permise : `<ellipse cx="32" cy="58.5" rx="…" ry="2.5" fill="#000" fill-opacity=".12"/>`.
4. **Éléments autorisés** : `path`, `circle`, `ellipse`, `rect`, `polygon`, `polyline`, `line`, `g`.
5. **Attributs autorisés** : `d`, coordonnées et rayons, `fill`, `fill-opacity`, `stroke`, `stroke-width`, `stroke-linecap`, `stroke-linejoin`, `stroke-opacity`, `opacity`, `transform`.
6. **Interdits** : `id`, `class`, `style`, la balise `<style>`, `<defs>`, les dégradés, `filter`, `mask`, `clipPath`, `<text>`, `<image>`, `<use>`, et tout fichier ou lien externe.
7. Couleurs en hexadécimal, uniquement celles de la palette.
8. Une ou deux décimales au plus. **Moins de 6 Ko par dessin.**
9. Le trait « manuel » s'obtient de préférence par des formes pleines d'épaisseur variable, plutôt que par un `stroke` uniforme. Si tu utilises `stroke`, mets `stroke-linecap="round"` et `stroke-linejoin="round"`.

## Le fichier à livrer

Un seul fichier **`illustrations-royaume.html`**, structuré ainsi :
- en haut, un commentaire HTML qui rappelle la palette utilisée ;
- puis, pour chaque dessin, un bloc `<figure>` qui contient le `<svg data-nom="…">` et une `<figcaption>` portant le même nom ;
- puis une **page d'aperçu** que j'ouvre dans un navigateur : chaque groupe (rangs, catégories, onglets, pictos) affiché deux fois, sur fond clair `#fbfdf9` et sur fond sombre `#1a2a1e`, en 24 px et en 96 px. L'aperçu peut utiliser du CSS dans une balise `<style>` en tête de page, mais aucun style à l'intérieur des `<svg>`.

Si le fichier est trop long pour une seule réponse, génère-le avec ton outil de code et donne-le en téléchargement. À défaut, livre-le en plusieurs parties (une par groupe), chacune étant un fichier HTML complet avec exactement la même structure.

## La méthode

**Étape 1.** Dessine d'abord 3 dessins tests : `rangs/04-jeune-plant`, `categories/graminee` et `onglets/herbier`. Présente-les dans le format ci-dessus, explique en trois lignes l'idée graphique qui fera la singularité de la série, puis **attends ma validation**.

**Étape 2.** Une fois validé, produis les 37 dessins dans le fichier final. Avant de livrer, vérifie toi-même chaque dessin :
- se lit-il à 20 px ?
- reste-t-il lisible sur fond sombre ?
- respecte-t-il toutes les règles techniques ?
- pourrait-il appartenir à n'importe quelle application ? Si oui, retravaille-le.
