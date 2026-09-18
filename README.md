# GenaTree — Arbre généalogique interactif

**GenaTree** est une page web autonome (HTML/CSS/JS, sans framework ni build) qui affiche un arbre généalogique interactif : parenté, couples, fiches de personnages avec photo, bio, réseaux sociaux, recherche, zoom/déplacement et partage de profil par lien.

Le projet sert de base à l'arbre de la famille **Hamilton (HMC)**, mais toutes les données sont des exemples et peuvent être entièrement remplacées.

## Sommaire

- [Structure du projet](#structure-du-projet)
- [Lancer le site en local](#lancer-le-site-en-local)
- [Personnaliser les données (les personnes)](#personnaliser-les-données-les-personnes)
- [Personnaliser les liens (familles, couples)](#personnaliser-les-liens-familles-couples)
- [Mise en forme des biographies (mini-markdown)](#mise-en-forme-des-biographies-mini-markdown)
- [Personnaliser l'apparence (couleurs, styles)](#personnaliser-lapparence-couleurs-styles)
- [Avatars Discord automatiques](#avatars-discord-automatiques)
- [Fonctionnalités de l'interface](#fonctionnalités-de-linterface)
- [Réglages avancés (js/family-tree.js)](#réglages-avancés-jsfamily-treejs)
- [Déploiement](#déploiement)
- [Licence](#licence)

## Structure du projet

```
GenaTree/
├── family-tree.html      # Page principale (structure HTML + textes affichés)
├── css/
│   └── family-tree.css   # Tous les styles et couleurs du site
├── js/
│   └── family-tree.js    # Toute la logique : mise en page auto, rendu, interactions
├── data/
│   └── family-data.json  # LES DONNÉES : personnes, familles, relations
└── LICENSE                # Licence MIT
```

Pour personnaliser l'arbre au quotidien, seul le fichier **`data/family-data.json`** doit être modifié. Les fichiers CSS et JS ne sont à toucher que pour changer l'apparence ou le comportement du site.

## Lancer le site en local

Le site charge `data/family-data.json` via `fetch()`, ce qui ne fonctionne pas en ouvrant simplement `family-tree.html` avec un double-clic (erreur liée au protocole `file://`). Il faut un petit serveur local :

- **VS Code** : installer l'extension *Live Server*, clic droit sur `family-tree.html` → « Open with Live Server ».
- **Python** (si installé) : depuis le dossier du projet, `python -m http.server 8000`, puis ouvrir `http://localhost:8000/family-tree.html`.
- **Node.js** : `npx serve .` puis ouvrir l'URL indiquée.

## Personnaliser les données (les personnes)

Tout se passe dans `data/family-data.json`, dans le tableau `people`. Chaque personne est un objet :

```json
{
  "id": "p1",
  "name": "Julien Moreau",
  "gender": "homme",
  "img": "https://exemple.com/photo.png",
  "discordId": "100000000000000001",
  "dates": "",
  "role": "Fondateur",
  "bio": "Texte de présentation. Supporte un peu de **markdown**.",
  "socials": {
    "Tiktok": "https://www.tiktok.com/@julien.moreau",
    "Discord": "https://discord.com/users/100000000000000001"
  },
  "order": 0
}
```

| Champ | Obligatoire | Description |
|---|---|---|
| `id` | oui | Identifiant unique (utilisé pour relier les personnes entre elles). Choisir un texte simple sans espace (`p1`, `julien`, …). |
| `name` | oui | Nom affiché sous l'avatar et dans la fiche. |
| `gender` | non | `homme`, `femme`, `nonbinaire` ou `autre`. Détermine la couleur de l'anneau autour de la photo (voir [Personnaliser l'apparence](#personnaliser-lapparence-couleurs-styles)). |
| `img` | non | URL d'une image de profil. Si absente (ou si `discordId` est fourni et résolu, voir plus bas), une image neutre par défaut est utilisée. |
| `discordId` | non | ID Discord numérique. Si renseigné, le site tente de récupérer automatiquement l'avatar Discord du membre (voir [Avatars Discord automatiques](#avatars-discord-automatiques)). Prime sur `img` si la récupération réussit. |
| `dates` | non | Texte libre affiché sous le nom (ex. dates de naissance, statut). |
| `role` | non | Rôle/titre affiché dans la fiche détaillée. |
| `bio` | non | Texte de présentation, affiché dans la fiche détaillée. Accepte une mise en forme simple, voir plus bas. |
| `socials` | non | Objet `{ "Nom du réseau": "URL" }`. Chaque entrée devient un bouton cliquable dans la fiche. Laisser `{}` si aucun réseau. |
| `order` | non | Nombre optionnel pour forcer un ordre horizontal si le placement automatique ne convient pas (plus la valeur est petite, plus la personne apparaît à gauche). En général inutile : la disposition est calculée automatiquement. |

Pour **ajouter une personne**, il suffit d'ajouter un nouvel objet dans le tableau `people` avec un `id` unique, puis de la relier via `families` et/ou `relations` (voir ci-dessous). Pour **retirer** quelqu'un, supprimer son objet du tableau ainsi que toutes les entrées de `families`/`relations` qui utilisent son `id`.

## Personnaliser les liens (familles, couples)

### Liens de parenté — `families`

```json
{ "parents": ["p6", "p9"], "children": ["p1", "p8"] }
```

Chaque entrée décrit une fratrie : un ou deux `parents` et une liste de `children`. On peut avoir :
- `"parents": ["p15"]` → un seul parent connu ;
- `"parents": []` interdit (utiliser plutôt de ne pas créer d'entrée) ;
- autant d'enfants que nécessaire dans `children`.

L'arbre calcule automatiquement les générations et l'alignement à partir de ces liens : il n'y a rien à positionner à la main.

### Relations amoureuses — `relations`

```json
{ "type": "love", "a": "p1", "b": "p2", "label": "Relation amoureuse" }
```

- `type`: actuellement `"love"` est le seul type géré visuellement (trait rose + cœur entre les deux personnes, et les deux sont alignées au même niveau dans l'arbre).
- `a` / `b` : les `id` des deux personnes concernées.
- `label` : texte affiché comme étiquette de la relation dans la fiche détaillée (« Relation amoureuse », « Relation amoureuse arrangée », etc. — libre).

Les cases à cocher « Relations amoureuses » / « Liens familiaux » dans le panneau latéral permettent d'afficher ou de masquer ces deux types de traits sans toucher aux données.

## Mise en forme des biographies (mini-markdown)

Le champ `bio` accepte une syntaxe légère, convertie automatiquement en HTML :

| Syntaxe | Résultat |
|---|---|
| `**gras**` | **gras** |
| `*italique*` | *italique* |
| `` `code` `` | `code` |
| `[texte](https://lien.com)` | lien cliquable |
| `> citation` | bloc de citation |
| `- item` (une ligne par item) | liste à puces |
| `1. item` | liste numérotée |
| ligne vide entre deux blocs | nouveau paragraphe |
| `\n` ou `<br>` en fin de ligne | retour à la ligne simple |

## Personnaliser l'apparence (couleurs, styles)

Toutes les couleurs du site sont centralisées en haut de `css/family-tree.css`, dans le bloc `:root`. Il suffit de changer ces valeurs pour reskin l'ensemble du site sans toucher au reste du CSS :

```css
:root {
    --hmc-bg: #10142e;        /* fond général (dégradé) */
    --hmc-bg-2: #080d1c;      /* fond secondaire (bas de dégradé) */
    --hmc-panel: #0b1022;     /* fond du panneau latéral */
    --hmc-panel-soft: #111734;/* fond des boutons */
    --hmc-border: rgba(255, 0, 184, .22); /* bordures roses translucides */
    --hmc-text: #f5f5f7;      /* texte principal */
    --hmc-muted: #b9bfd1;     /* texte secondaire (sous-titres, dates) */
    --hmc-line: rgba(120, 170, 255, .72); /* traits de parenté */
    --hmc-blue: #188cff;      /* couleur "homme" (anneau + légende) */
    --hmc-female: #ea00ff;    /* couleur "femme" */
    --hmc-yellow: #f5bd28;    /* couleur "non-binaire" */
    --hmc-gray: #98a2b3;      /* couleur "autre" */
    --hmc-love: #ff00b8;      /* accent rose : titres, trait amoureux, focus */
    --hmc-divorce: #b8bed4;   /* couleur des traits de séparation (si utilisés) */
    --hmc-focus: #ff00b8;     /* couleur de sélection / focus clavier */
    --hmc-shadow: 0 18px 45px rgba(0, 0, 0, .38);
}
```

Points utiles :
- La couleur de l'anneau autour d'un avatar dépend du champ `gender` de la personne, via les classes CSS `.avatar-ring.femme`, `.avatar-ring.nonbinaire`, `.avatar-ring.autre` (le cas `homme`/par défaut utilise `--hmc-blue`). Pour ajouter un nouveau genre personnalisé, il faut ajouter une règle `.avatar-ring.<valeur>` correspondante dans le CSS.
- Le titre du site et le nom de famille affiché dans le panneau (« Famille Hamilton », sous-titre, placeholder de recherche…) se modifient directement dans `family-tree.html`, dans la balise `<title>` et dans la section `<aside class="family-panel">`.
- Les espacements de l'arbre (distance entre générations, entre couples, entre fratries) sont réglables dans `js/family-tree.js`, fonction `computeAutoLayout()` : constantes `yGap`, `coupleGap`, `blockGap`, `itemGap`, `singleWidth`, `marginX`, `marginY`.

## Avatars Discord automatiques

En haut de `js/family-tree.js` :

```js
const WORKER_URL = 'https://divine-moon-e24f.ptitleo2009.workers.dev/';
const GUILD_ID = '1025887285461405817';
```

Si une personne a un `discordId`, le site interroge ce Worker Cloudflare (`WORKER_URL?guild=GUILD_ID&ids=...`) au chargement pour récupérer sa photo de profil Discord actuelle sur le serveur `GUILD_ID`, et l'utilise à la place de `img`.

Pour réutiliser cette fonctionnalité avec un **autre serveur Discord**, il faut :
1. Déployer son propre petit Worker/backend qui interroge l'API Discord (bot avec les droits nécessaires) et renvoie un JSON `{ "discordId": "urlAvatar", ... }`.
2. Remplacer `WORKER_URL` par l'URL de ce Worker et `GUILD_ID` par l'ID du serveur Discord concerné.

Si aucun `discordId` n'est utilisé dans les données, cette étape est ignorée automatiquement (aucune requête n'est envoyée) et `img` (ou l'image neutre par défaut) est utilisée.

L'image neutre par défaut, utilisée quand ni `img` ni un avatar Discord ne sont disponibles, est définie par :

```js
const NEUTRAL_IMG = 'https://kiro701.github.io/BoucleRP/Image/Profil-Neutre.avif';
```

à remplacer par l'URL d'une image neutre de son choix si besoin.

## Fonctionnalités de l'interface

- **Recherche** (`familySearch`) : filtre en direct par nom ou rôle, met en surbrillance les correspondances et centre la vue sur le premier résultat.
- **Filtres** : deux cases à cocher pour afficher/masquer les traits « Relations amoureuses » et « Liens familiaux ».
- **Clic sur une personne** : ouvre une fiche détaillée (photo, rôle, bio formatée, relations, réseaux sociaux) et met en évidence les traits qui la concernent.
- **Zoom / déplacement** : molette de la souris pour zoomer, glisser-déposer (clic + déplacer) pour naviguer, boutons `+`/`−`/`⌖` (centrer)/`⛶` (plein écran) en haut à droite du canevas.
- **Réinitialiser** : remet le zoom, la sélection et la recherche à zéro et recadre l'arbre entier.
- **Partager un profil** : le bouton « 🔗 Partager ce profil » dans la fiche copie dans le presse-papiers un lien de la forme `family-tree.html?profile=p1`, qui ouvre directement la fiche de cette personne au chargement de la page.
- **Statistiques** : nombre de membres et de relations, calculés automatiquement à partir de `family-data.json`.

## Réglages avancés (js/family-tree.js)

En tête de fichier :

```js
const FAMILY_DATA_URL = 'data/family-data.json'; // chemin du fichier de données
const WORKER_URL = '...';                         // backend des avatars Discord
const GUILD_ID = '...';                           // ID du serveur Discord
const NEUTRAL_IMG = '...';                        // image par défaut
```

- Renommer ou déplacer `family-data.json` ? Adapter `FAMILY_DATA_URL` en conséquence (chemin relatif à `family-tree.html`).
- Les limites de zoom (`0.35` à `2.2`) et la sensibilité de la molette (`1.09`/`0.91`) se règlent dans la fonction gérant l'évènement `wheel`.
- L'algorithme de placement automatique (générations, alignement des couples et des fratries) est entièrement contenu dans `computeLevels()`, `computeSubtreeOrder()` et `computeAutoLayout()` : il n'y a normalement pas besoin d'y toucher, sauf pour ajuster les espacements visuels mentionnés plus haut.

## Déploiement

Le projet est un site 100% statique (aucun serveur/backend requis à part le Worker optionnel pour les avatars Discord), il peut donc être publié tel quel sur **GitHub Pages**, Netlify, Vercel, ou tout hébergement statique : il suffit de pousser le dossier et de pointer l'hébergement sur `family-tree.html` (ou de le renommer `index.html`).

Dépôt actuel : `https://github.com/Unis-Studio/GenaTree`

Note : les balises `<div id="header"></div>` et `<div id="footer"></div>` dans `family-tree.html` sont des emplacements vides, prévus pour être remplis par un en-tête/pied de page commun si cette page est intégrée dans un site plus large. Sans intégration externe, elles restent simplement vides.

## Licence

Ce projet est distribué sous licence **MIT** (voir le fichier `LICENSE`) — libre d'utilisation, de modification et de redistribution, y compris à des fins commerciales, à condition de conserver la mention de copyright.

## Crédit

Ce projet a été réalisé par **Kiro701** avec l'assistance de l'intéligence artificiel.