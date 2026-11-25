# Fiches d’akkadien

Application web sans serveur : ouvrez `index.html`, importez un fichier JSON, lisez les fiches.
Fichiers : `index.html` (structure), `style.css` (apparence), `script.js` (logique), `exemple.json` (modèle).

## Format JSON
Tous les champs sont facultatifs sauf `titre_cours`, `sections`, et `titre` pour chaque section / fiche.

- Racine : `titre_cours` (texte), `source` (texte), `sections` (liste)
- Section : `titre`, puis `sections` (sous-sections, autant de niveaux que nécessaire) et/ou `fiches`
- Fiche : `titre`, `pages_source`, `resume`, puis les listes suivantes :
  - `notions` : `{ "titre", "contenu", "important": true/false }`
  - `tableaux` : `{ "titre", "entetes": [...], "lignes": [[...], ...] }`
  - `vocabulaire` : `{ "akkadien", "traduction", "remarque" }`
  - `signes` : `{ "signe", "valeurs": [...], "signification" }`
  - `exemples` : `{ "akkadien" (cunéiforme), "translitteration", "traduction", "explication" }`
  - `exceptions` : liste de textes
  - `remarques` : liste de textes