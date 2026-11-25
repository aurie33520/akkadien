"use strict";

// ---------- Données gardées en mémoire (perdues au rechargement, c'est voulu) ----------
let fiches = [];   // liste à plat de toutes les fiches : { fiche, chemin }
let courant = -1;  // numéro de la fiche affichée

const $ = (id) => document.getElementById(id);
const liste = (x) => (Array.isArray(x) ? x : []);   // un champ absent devient une liste vide

// Crée un élément HTML. Le texte est inséré en "textContent" : le contenu du JSON ne peut pas casser la page.
function el(balise, classe, texte) {
  const e = document.createElement(balise);
  if (classe) e.className = classe;
  if (texte !== undefined && texte !== null && texte !== "") e.textContent = texte;
  return e;
}

// ---------- 1. Importation et vérification ----------
function verifierSections(sections, chemin) {
  if (!Array.isArray(sections)) throw new Error(`« ${chemin} » doit être une liste.`);
  sections.forEach((s, i) => {
    const lieu = `${chemin}[${i}]`;
    if (!s || typeof s.titre !== "string") throw new Error(`Le champ "titre" est manquant dans ${lieu}.`);
    if (!s.sections && !s.fiches) throw new Error(`La section « ${s.titre} » n’a ni "sections" ni "fiches".`);
    if (s.sections) verifierSections(s.sections, `${lieu}.sections`);
    if (s.fiches) {
      if (!Array.isArray(s.fiches)) throw new Error(`"fiches" doit être une liste dans « ${s.titre} ».`);
      s.fiches.forEach((f, j) => {
        if (!f || typeof f.titre !== "string") throw new Error(`Le champ "titre" est manquant dans ${lieu}.fiches[${j}].`);
      });
    }
  });
}

function charger(texte) {
  try {
    let data;
    try { data = JSON.parse(texte); }
    catch (e) { throw new Error("Ce texte n’est pas du JSON valide : " + e.message); }
    if (!data || typeof data.titre_cours !== "string") throw new Error('Le champ "titre_cours" est manquant.');
    verifierSections(data.sections, "sections");
    $("erreur").textContent = "";
    afficherCours(data);
  } catch (e) {
    $("erreur").textContent = e.message;   // l'ancien jeu de fiches reste intact
  }
}

// ---------- 2. Navigation latérale ----------
function afficherCours(data) {
  fiches = [];
  $("nav").replaceChildren();
  construireNav(data.sections, $("nav"), []);
  $("titre-app").textContent = data.titre_cours + (data.source ? " — " + data.source : "");
  montrer("lecteur");
  if (fiches.length) ouvrir(0);
  else $("fiche").replaceChildren(el("p", "", "Ce fichier ne contient aucune fiche."));
}

function construireNav(sections, parent, chemin) {
  for (const s of sections) {
    const cheminSection = [...chemin, s.titre];
    const d = el("details");
    d.open = chemin.length === 0;               // seul le premier niveau est déplié au départ
    d.append(el("summary", "", s.titre));
    for (const f of liste(s.fiches)) {
      const numero = fiches.length;
      fiches.push({ fiche: f, chemin: cheminSection });
      const b = el("button", "lien-fiche", f.titre);
      b.type = "button";
      b.dataset.i = numero;
      b.addEventListener("click", () => ouvrir(numero));
      d.append(b);
    }
    construireNav(liste(s.sections), d, cheminSection);   // niveaux suivants
    parent.append(d);
  }
}

function montrer(ecran) {   // "import" ou "lecteur"
  $("import").hidden = ecran !== "import";
  $("lecteur").hidden = ecran !== "lecteur";
  $("btn-import").hidden = fiches.length === 0 && ecran === "import";
  $("btn-liste").hidden = ecran !== "lecteur";
  $("btn-annuler").hidden = fiches.length === 0;
}

function ouvrir(i) {
  if (i < 0 || i >= fiches.length) return;
  courant = i;
  afficherFiche(i);
  let actif = null;
  document.querySelectorAll(".lien-fiche").forEach((b) => {
    const estActif = Number(b.dataset.i) === i;
    b.classList.toggle("actif", estActif);
    if (estActif) actif = b;
  });
  for (let p = actif && actif.parentElement; p && p.id !== "nav"; p = p.parentElement) {
    if (p.tagName === "DETAILS") p.open = true;  // déplie les sections parentes
  }
  $("nav").classList.remove("ouvert");
  window.scrollTo(0, 0);
}

// ---------- 3. Affichage d'une fiche ----------
function bloc(parent, titre, items, fabrique, classeConteneur) {
  if (!items.length) return;                    // rien à afficher si le champ est absent ou vide
  const s = el("section", "bloc " + (classeConteneur || ""));
  s.append(el("h3", "", titre));
  items.forEach((x) => s.append(fabrique(x)));
  parent.append(s);
}

function afficherFiche(i) {
  const { fiche: f, chemin } = fiches[i];
  const a = el("article");
  a.append(el("p", "fil", chemin.join(" › ")));
  a.append(el("h2", "", f.titre));
  if (f.pages_source) a.append(el("p", "source", "Pages du cours : " + f.pages_source));
  if (f.resume) a.append(el("p", "resume", f.resume));

  bloc(a, "Notions et règles", liste(f.notions), (x) => {
    const n = typeof x === "string" ? { contenu: x } : x || {};
    const c = el("div", "carte regle" + (n.important ? " important" : ""));
    if (n.titre) c.append(el("h4", "", n.titre));
    c.append(el("p", "", n.contenu));
    return c;
  });

  bloc(a, "Tableaux", liste(f.tableaux), (t) => {
    const c = el("div", "carte");
    if (t.titre) c.append(el("h4", "", t.titre));
    const table = el("table");
    if (liste(t.entetes).length) {
      const tr = el("tr");
      t.entetes.forEach((h) => tr.append(el("th", "", String(h))));
      const thead = el("thead");
      thead.append(tr);
      table.append(thead);
    }
    const corps = el("tbody");
    liste(t.lignes).forEach((ligne) => {
      const tr = el("tr");
      liste(ligne).forEach((cell) => tr.append(el("td", "", String(cell ?? ""))));
      corps.append(tr);
    });
    table.append(corps);
    const defile = el("div", "defile");
    defile.append(table);
    c.append(defile);
    return c;
  });

  bloc(a, "Vocabulaire", liste(f.vocabulaire), (v) => {
    const r = el("div", "vocab");
    r.append(el("span", "akk", v.akkadien), el("span", "", v.traduction));
    if (v.remarque) r.append(el("span", "rem", v.remarque));
    return r;
  });

  bloc(a, "Signes cunéiformes", liste(f.signes), (s) => {
    const r = el("div", "carte signe");
    r.append(el("span", "cunei", s.signe));
    const d = el("div");
    const valeurs = Array.isArray(s.valeurs) ? s.valeurs.join(", ") : s.valeurs;
    if (valeurs) d.append(el("p", "", "Valeurs : " + valeurs));
    if (s.signification) d.append(el("p", "", "Signification : " + s.signification));
    r.append(d);
    return r;
  });

  bloc(a, "Exemples", liste(f.exemples), (x) => {
    const c = el("div", "carte exemple");
    if (x.akkadien) c.append(el("p", "cunei", x.akkadien));
    if (x.translitteration) c.append(el("p", "translit", x.translitteration));
    if (x.traduction) c.append(el("p", "trad", "« " + x.traduction + " »"));
    if (x.explication) c.append(el("p", "expl", x.explication));
    return c;
  });

  bloc(a, "Exceptions", liste(f.exceptions), (x) => el("div", "attention", String(x)));
  bloc(a, "Remarques", liste(f.remarques), (x) => el("div", "note", String(x)));

  // Barre précédent / suivant
  const barre = el("div", "barre");
  const prec = el("button", "btn", "← Précédente");
  const suiv = el("button", "btn", "Suivante →");
  prec.type = suiv.type = "button";
  prec.disabled = i === 0;
  suiv.disabled = i === fiches.length - 1;
  prec.addEventListener("click", () => ouvrir(courant - 1));
  suiv.addEventListener("click", () => ouvrir(courant + 1));
  barre.append(prec, el("span", "compteur", `${i + 1} / ${fiches.length}`), suiv);
  a.append(barre);

  $("fiche").replaceChildren(a);
}

// ---------- 4. Boutons ----------
$("fichier").addEventListener("change", async (e) => {
  const fichier = e.target.files[0];
  if (fichier) charger(await fichier.text());
  e.target.value = "";                          // permet de re-choisir le même fichier
});
$("btn-coller").addEventListener("click", () => charger($("texte-colle").value));
$("btn-import").addEventListener("click", () => montrer("import"));
$("btn-annuler").addEventListener("click", () => montrer("lecteur"));
$("btn-liste").addEventListener("click", () => $("nav").classList.toggle("ouvert"));

// ---------- 5. Fichiers placés à côté de index.html ----------
// Ajoutez ici les noms de vos fichiers JSON, entre guillemets, séparés par des virgules.
const FICHIERS = ["seance3.json","seance4.json","seance5.json","seance6.json","seance7.json"];

function afficherFichiersDuDossier() {
  const zone = $("fichiers-dossier");
  if (!FICHIERS.length) return;
  zone.append(el("p", "", "Fichiers du dossier :"));
  const boutons = el("div", "actions");
  FICHIERS.forEach((nom) => {
    const b = el("button", "btn principal", nom);
    b.type = "button";
    b.addEventListener("click", async () => {
      try {
        const reponse = await fetch(nom);
        if (!reponse.ok) throw new Error("Fichier introuvable : " + nom);
        charger(await reponse.text());
      } catch (e) {
        $("erreur").textContent = e.message.startsWith("Fichier introuvable") ? e.message :
          "Impossible de lire « " + nom + " ». Si vous avez ouvert index.html par double-clic, le navigateur bloque cette lecture : " +
          "utilisez GitHub Pages ou un serveur local (voir plus bas).";
      }
    });
    boutons.append(b);
  });
  zone.append(boutons, el("p", "ou", "ou"));
}

afficherFichiersDuDossier();
montrer("import");