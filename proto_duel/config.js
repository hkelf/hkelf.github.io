// =====================================================================
// CONFIGURATION DU PROTOTYPE DE DUEL
// Tout le jeu lit ce fichier. Modifier ici, recharger la page.
// Durées en "tours" : 0 = jusqu'à la fin du tour courant, 1 = jusqu'à la fin du tour suivant, etc.
// =====================================================================
window.GAME_CONFIG = {

  // ------------------------------------------------------------------
  // RÈGLES GÉNÉRALES
  // ------------------------------------------------------------------
  regles: {
    tailleTerrain: 3,          // personnages sur le terrain au départ
    tailleBanc: 1,             // personnages au banc (cachés)
    attaquesParPerso: 4,       // attaques choisies au Building
    maxParClasse: 1,           // exemplaires max d'une même classe par équipe (1 = clause d'espèce Pokémon ; 0 = sans limite)
    limiteTours: 0,            // 0 = sans limite ; sinon fin de match au tour N (survivants, puis PV restants)

    // Noms des cases selon la taille du plateau (de l'avant vers l'arrière)
    cases: {
      3: ['avant', 'centre', 'arrière'],
      2: ['avant', 'arrière'],
      1: ['avant'],
    },
    // Report des ciblages quand une case n'existe plus (case visée -> case réelle)
    redirection: {
      2: { centre: 'avant' },
      1: { centre: 'avant', 'arrière': 'avant' },
    },
    plateauRetrecit: true,     // false = les cases des K.O. restent vides
    remplacementAuto: true,    // après un K.O., le premier du banc entre sur la case libérée (fin de tour)
    departage: 'hasard',       // égalité priorité + Vitesse : 'hasard' | 'joueur1' | 'joueur2'

    degats: {
      minimum: 1,
      multAvantage: 2,
      divDesavantage: 2,
      arrondi: 'inferieur',    // 'inferieur' | 'superieur' | 'proche'
      bonusElement: 1,         // +Puissance si l'attaque a l'élément de l'équipement du lanceur
      bonusElementActif: true,
      bonusFatigue: 1,         // +dégâts par coup reçu par un fatigué (après affinité)
      bonusFatigueActif: true,
    },

    fatigue: {
      active: true,
      minPersosDebout: 1,      // la fatigue ne s'applique que si le camp a au moins N persos debout
      switchFatigue: false,    // true = le remplaçant entré par switch est fatigué au tour suivant
      bancEfface: true,        // un perso qui part au banc perd sa fatigue
    },

    switch: {
      actif: true,
      priorite: 10,            // passe avant toute attaque de priorité inférieure
      bloqueParRacines: true,
    },

    positionsLancement: {
      actives: true,             // false = toutes les attaques utilisables de partout
      verifieeALaResolution: true, // si le lanceur a été déplacé avant d'agir, l'attaque échoue
      repliSiAucune: true,       // perso frais sans aucune attaque utilisable depuis sa case : move pool universel
    },
    modificateurs: {             // setup (hausses) et debuff (baisses) de stats
      plafond: 2,                // cumul max par stat, en + comme en − (ex. 2 = de −2 à +2)
      reinitialiseAuBanc: true,  // un perso qui part au banc perd hausses et baisses (comme Pokémon)
    },
    canalModifiable: true,     // le Building permet de basculer chaque attaque en physique/magique
    elementNeutre: 'Neutre',   // élément sans affinité (move pool universel)
  },

  // ------------------------------------------------------------------
  // ÉLÉMENTS : 'bat' = liste des éléments contre lesquels on a l'avantage
  // ------------------------------------------------------------------
  elements: {
    Bois:    { glyphe: '木', couleur: '#3f7d4e', couleurSombre: '#6fb27f', bat: ['Terre', 'Eau'] },
    Feu:     { glyphe: '火', couleur: '#b83a2e', couleurSombre: '#e2685a', bat: ['Métal', 'Bois'] },
    Terre:   { glyphe: '土', couleur: '#a87a26', couleurSombre: '#d6a64c', bat: ['Eau', 'Feu'] },
    'Métal': { glyphe: '金', couleur: '#7c8592', couleurSombre: '#b3bbc6', bat: ['Bois', 'Terre'] },
    Eau:     { glyphe: '水', couleur: '#2d5f99', couleurSombre: '#6f9fdc', bat: ['Feu', 'Métal'] },
    Neutre:  { glyphe: '·',  couleur: '#6b6b6b', couleurSombre: '#9a9a9a', bat: [] },
  },

  // ------------------------------------------------------------------
  // CIBLAGES : liste des cases frappées (une case répétée = un coup de plus)
  // Ciblages spéciaux gérés par le moteur : 'enFace', 'soi', 'allieDevant'
  // ------------------------------------------------------------------
  ciblages: {
    avant:         { nom: 'avant',            cases: ['avant'] },
    centre:        { nom: 'centre',           cases: ['centre'] },
    arriere:       { nom: 'arrière',          cases: ['arrière'] },
    ligne:         { nom: 'toute la ligne',   cases: ['avant', 'centre', 'arrière'] },
    avantCentre:   { nom: 'avant + centre',   cases: ['avant', 'centre'] },
    centreArriere: { nom: 'centre + arrière', cases: ['centre', 'arrière'] },
    extremites:    { nom: 'avant + arrière',  cases: ['avant', 'arrière'] },
    enFace:        { nom: 'en face' },
    soi:           { nom: 'soi' },
    allieDevant:   { nom: 'allié devant (soi si à l’avant)' },
  },

  // ------------------------------------------------------------------
  // STATISTIQUES (libellés)
  // ------------------------------------------------------------------
  stats: { pv: 'PV', attP: 'Att P', defP: 'Déf P', attM: 'Att M', defM: 'Déf M', vit: 'Vit' },

  // ------------------------------------------------------------------
  // ATTAQUES
  // element, cible (clé de 'ciblages'), puissance (0 = pas de dégâts), priorite, canal par défaut ('P'/'M', sinon celui de la classe)
  // depuis : cases d'où le lanceur peut utiliser l'attaque (absent = toutes). Sur plateau réduit, la redirection s'applique
  //          (ex. une attaque 'centre' devient utilisable depuis l'avant à 2 cases).
  // effets possibles :
  //   { type:'soin', montant }                       sur la cible alliée (soi / allieDevant)
  //   { type:'regeneration', montant, tours }        soin au début des N prochains tours
  //   { type:'racines', tours }                      cibles touchées : ni déplacement ni switch
  //   { type:'drain', ratio }                        le lanceur récupère ratio × dégâts (arrondi inférieur)
  //   { type:'contrecoup', montant }                 le lanceur subit des dégâts
  //   { type:'pousser', cases } / { type:'tirer', cases }   déplace la 1re cible
  //   { type:'echangerCibles' }                      échange les deux premières cases visées
  //   { type:'defense', bonus, tours, inamovible }   bonus Déf P et M sur le lanceur
  //   { type:'deplacerSoi', direction }              'avant' | 'arriere' | 'arriereSinonAvant'
  //   { type:'modStats', sur, stats, tours }        setup / debuff : sur = 'lanceur' | 'cibles' | 'allieDevant'
  //                                                  stats = { attP:+1, vit:-2, ... } ; tours absent = jusqu'au banc ou au K.O.
  //                                                  une attaque de puissance 0 qui vise l'adversaire ne fait pas de dégâts, seulement l'effet
  // ------------------------------------------------------------------
  attaques: {
    seve:        { nom: 'Sève',         element: 'Bois',  cible: 'allieDevant',   puissance: 0, priorite: 0, depuis: ['centre','arrière'], effets: [{ type: 'soin', montant: 3 }] },
    regen:       { nom: 'Régénération', element: 'Bois',  cible: 'soi',           puissance: 0, priorite: 0, effets: [{ type: 'regeneration', montant: 1, tours: 2 }] },
    racines:     { nom: 'Racines',      element: 'Bois',  cible: 'avant',         puissance: 2, priorite: 0, depuis: ['avant','centre'], effets: [{ type: 'racines', tours: 1 }] },
    drain:       { nom: 'Drain',        element: 'Bois',  cible: 'enFace',        puissance: 2, priorite: 0, effets: [{ type: 'drain', ratio: 0.5 }] },
    brasier:     { nom: 'Brasier',      element: 'Feu',   cible: 'avant',         puissance: 4, priorite: 0, depuis: ['avant','centre'], effets: [] },
    flamme:      { nom: 'Flamme',       element: 'Feu',   cible: 'enFace',        puissance: 3, priorite: 0, depuis: ['centre','arrière'], effets: [] },
    embrasement: { nom: 'Embrasement',  element: 'Feu',   cible: 'avant',         puissance: 5, priorite: 0, depuis: ['avant'], effets: [{ type: 'contrecoup', montant: 1 }] },
    braise:      { nom: 'Braise',       element: 'Feu',   cible: 'centre',        puissance: 3, priorite: 0, depuis: ['centre','arrière'], effets: [] },
    seisme:      { nom: 'Séisme',       element: 'Terre', cible: 'ligne',         puissance: 1, priorite: 0, depuis: ['avant','centre'], effets: [] },
    eboulement:  { nom: 'Éboulement',   element: 'Terre', cible: 'avantCentre',   puissance: 2, priorite: 0, depuis: ['avant'], effets: [] },
    secousse:    { nom: 'Secousse',     element: 'Terre', cible: 'extremites',    puissance: 1, priorite: 0, effets: [] },
    rempart:     { nom: 'Rempart',      element: 'Terre', cible: 'soi',           puissance: 0, priorite: 0, depuis: ['avant','centre'], effets: [{ type: 'defense', bonus: 2, tours: 1, inamovible: true }] },
    lame:        { nom: 'Lame',         element: 'Métal', cible: 'arriere',       puissance: 3, priorite: 0, depuis: ['avant','centre'], effets: [] },
    estoc:       { nom: 'Estoc',        element: 'Métal', cible: 'enFace',        puissance: 2, priorite: 1, depuis: ['avant','centre'], effets: [] },
    flechette:   { nom: 'Fléchette',    element: 'Métal', cible: 'arriere',       puissance: 1, priorite: 1, depuis: ['centre','arrière'], effets: [] },
    tranchant:   { nom: 'Tranchant',    element: 'Métal', cible: 'centreArriere', puissance: 2, priorite: 0, depuis: ['avant','centre'], effets: [] },
    vague:       { nom: 'Vague',        element: 'Eau',   cible: 'avant',         puissance: 2, priorite: 0, depuis: ['avant','centre'], effets: [{ type: 'pousser', cases: 1 }] },
    courant:     { nom: 'Courant',      element: 'Eau',   cible: 'arriere',       puissance: 1, priorite: 0, depuis: ['centre','arrière'], effets: [{ type: 'tirer', cases: 1 }] },
    remous:      { nom: 'Remous',       element: 'Eau',   cible: 'extremites',    puissance: 1, priorite: 0, effets: [{ type: 'echangerCibles' }] },
    glissade:    { nom: 'Glissade',     element: 'Eau',   cible: 'soi',           puissance: 0, priorite: 1, effets: [{ type: 'deplacerSoi', direction: 'arriereSinonAvant' }] },

    // --- Setup (hausses sur soi ou un allié) ---
    attiser:     { nom: 'Attiser',      element: 'Feu',   cible: 'soi',           puissance: 0, priorite: 0, effets: [{ type: 'modStats', sur: 'lanceur', stats: { attP: 1, attM: 1 } }] },
    aiguiser:    { nom: 'Aiguiser',     element: 'Métal', cible: 'soi',           puissance: 0, priorite: 0, effets: [{ type: 'modStats', sur: 'lanceur', stats: { attP: 1, vit: 1 } }] },
    cuirasse:    { nom: 'Cuirasse',     element: 'Terre', cible: 'soi',           puissance: 0, priorite: 0, depuis: ['avant', 'centre'], effets: [{ type: 'modStats', sur: 'lanceur', stats: { defP: 1, defM: 1 } }] },
    floraison:   { nom: 'Floraison',    element: 'Bois',  cible: 'soi',           puissance: 0, priorite: 0, effets: [{ type: 'modStats', sur: 'lanceur', stats: { attM: 1 } }, { type: 'soin', montant: 2 }] },
    maree:       { nom: 'Marée porteuse', element: 'Eau', cible: 'allieDevant',   puissance: 0, priorite: 0, depuis: ['centre', 'arrière'], effets: [{ type: 'modStats', sur: 'allieDevant', stats: { vit: 2 } }] },

    // --- Debuff (baisses sur l'adversaire) ---
    brulure:     { nom: 'Brûlure',      element: 'Feu',   cible: 'avant',         puissance: 2, priorite: 0, depuis: ['avant', 'centre'], effets: [{ type: 'modStats', sur: 'cibles', stats: { attP: -1 } }] },
    fendre:      { nom: 'Fendre',       element: 'Métal', cible: 'enFace',        puissance: 2, priorite: 0, depuis: ['avant', 'centre'], effets: [{ type: 'modStats', sur: 'cibles', stats: { defP: -1 } }] },
    grondement:  { nom: 'Grondement',   element: 'Terre', cible: 'ligne',         puissance: 0, priorite: 0, effets: [{ type: 'modStats', sur: 'cibles', stats: { attP: -1 } }] },
    spores:      { nom: 'Spores',       element: 'Bois',  cible: 'enFace',        puissance: 0, priorite: 0, effets: [{ type: 'modStats', sur: 'cibles', stats: { vit: -2 } }] },
    brume:       { nom: 'Brume',        element: 'Eau',   cible: 'centreArriere', puissance: 0, priorite: 0, depuis: ['centre', 'arrière'], effets: [{ type: 'modStats', sur: 'cibles', stats: { attM: -1 } }] },

    // Move pool universel (perso fatigué)
    coup:        { nom: 'Coup',         element: 'Neutre', cible: 'enFace', puissance: 1, priorite: 0, canal: 'P', effets: [] },
    avancer:     { nom: 'Avancer',      element: 'Neutre', cible: 'soi',    puissance: 0, priorite: 0, effets: [{ type: 'deplacerSoi', direction: 'avant' }] },
    reculer:     { nom: 'Reculer',      element: 'Neutre', cible: 'soi',    puissance: 0, priorite: 0, effets: [{ type: 'deplacerSoi', direction: 'arriere' }] },
    garde:       { nom: 'Garde',        element: 'Neutre', cible: 'soi',    puissance: 0, priorite: 2, effets: [{ type: 'defense', bonus: 1, tours: 0, inamovible: false }] },
  },

  // Attaques disponibles pour un perso fatigué (dans l'ordre des boutons)
  movePoolUniversel: ['coup', 'avancer', 'reculer', 'garde'],

  // ------------------------------------------------------------------
  // ÉQUIPEMENTS : donnent l'élément (affinité défensive) et des modificateurs de stats
  // ------------------------------------------------------------------
  equipements: {
    ecorce:   { nom: 'Écorce vivante',  element: 'Bois',  mods: { pv: 3, vit: -1 } },
    brassard: { nom: 'Brassard ardent', element: 'Feu',   mods: { attP: 1, attM: 1, defP: -1 } },
    roche:    { nom: 'Armure de roche', element: 'Terre', mods: { defP: 1, defM: 1, vit: -1 } },
    acier:    { nom: 'Lame d’acier',    element: 'Métal', mods: { attP: 1, vit: 1, defM: -1 } },
    onde:     { nom: 'Voile d’onde',    element: 'Eau',   mods: { defM: 1, vit: 1, attP: -1 } },
  },

  // ------------------------------------------------------------------
  // ACCESSOIRES : mods de stats + effets
  //   { type:'survie', seuilPV, utilisations }   survit à 1 PV si PV >= seuilPV × max avant le coup
  //   { type:'antiRacines', utilisations }       annule Racines
  //   { type:'verrouChoix' }                     bloqué sur la 1re attaque utilisée jusqu'à la sortie
  //   { type:'rage', bonusDegats, coutPV }       +dégâts par coup, perd des PV à chaque attaque
  //   { type:'soinFinDeTour', montant }
  //   { type:'antiBaisse', utilisations }       annule une baisse de stats infligée par l'adversaire
  // ------------------------------------------------------------------
  accessoires: {
    aucun:   { nom: 'Aucun',              mods: {},       effets: [] },
    survie:  { nom: 'Talisman de survie', mods: {},       effets: [{ type: 'survie', seuilPV: 1, utilisations: 1 }] },
    fiole:   { nom: 'Fiole',              mods: {},       effets: [{ type: 'antiRacines', utilisations: 1 }] },
    gant:    { nom: 'Gant de focus',      mods: { vit: 2 }, effets: [{ type: 'verrouChoix' }] },
    rage:    { nom: 'Orbe de rage',       mods: {},       effets: [{ type: 'rage', bonusDegats: 1, coutPV: 1 }] },
    bandage: { nom: 'Bandage',            mods: {},       effets: [{ type: 'soinFinDeTour', montant: 1 }] },
    amulette:{ nom: 'Amulette pure',      mods: {},       effets: [{ type: 'antiBaisse', utilisations: 1 }] },
  },

  // ------------------------------------------------------------------
  // CLASSES : stats de base, canal par défaut, équipements autorisés, move pool, attaques par défaut
  // ------------------------------------------------------------------
  classes: {
    Gardien:   { stats: { pv: 18, attP: 2, defP: 3, attM: 0, defM: 2, vit: 2 }, canal: 'P',
                 equipements: ['roche', 'acier'],
                 movePool: ['rempart', 'seisme', 'eboulement', 'racines', 'brasier', 'vague', 'cuirasse', 'grondement'],
                 parDefaut: ['rempart', 'eboulement', 'racines', 'seisme'] },
    Assassin:  { stats: { pv: 9, attP: 4, defP: 1, attM: 1, defM: 1, vit: 9 }, canal: 'P',
                 equipements: ['acier', 'onde'],
                 movePool: ['lame', 'flechette', 'estoc', 'tranchant', 'courant', 'glissade', 'aiguiser', 'fendre'],
                 parDefaut: ['lame', 'flechette', 'estoc', 'glissade'] },
    Arcaniste: { stats: { pv: 11, attP: 0, defP: 1, attM: 4, defM: 2, vit: 5 }, canal: 'M',
                 equipements: ['brassard', 'ecorce'],
                 movePool: ['brasier', 'flamme', 'embrasement', 'braise', 'drain', 'secousse', 'attiser', 'brulure'],
                 parDefaut: ['brasier', 'flamme', 'braise', 'embrasement'] },
    Tacticien: { stats: { pv: 13, attP: 2, defP: 2, attM: 2, defM: 2, vit: 6 }, canal: 'P',
                 equipements: ['onde', 'roche'],
                 movePool: ['vague', 'courant', 'remous', 'glissade', 'racines', 'secousse', 'maree', 'brume'],
                 parDefaut: ['vague', 'courant', 'remous', 'racines'] },
    Druide:    { stats: { pv: 14, attP: 0, defP: 1, attM: 2, defM: 3, vit: 4 }, canal: 'M',
                 equipements: ['ecorce', 'onde'],
                 movePool: ['seve', 'regen', 'drain', 'racines', 'courant', 'seisme', 'floraison', 'spores'],
                 parDefaut: ['seve', 'regen', 'drain', 'racines'] },
  },

  // ------------------------------------------------------------------
  // ÉQUIPES PAR DÉFAUT (ordre = avant, centre, arrière, puis banc)
  // attaques omises = 'parDefaut' de la classe
  // ------------------------------------------------------------------
  equipesParDefaut: [
    [
      { classe: 'Gardien',   equipement: 'roche',    accessoire: 'bandage' },
      { classe: 'Arcaniste', equipement: 'brassard', accessoire: 'rage' },
      { classe: 'Assassin',  equipement: 'acier',    accessoire: 'survie' },
      { classe: 'Druide',    equipement: 'ecorce',   accessoire: 'fiole' },
    ],
    [
      { classe: 'Tacticien', equipement: 'onde',     accessoire: 'survie' },
      { classe: 'Arcaniste', equipement: 'ecorce',   accessoire: 'rage' },
      { classe: 'Assassin',  equipement: 'onde',     accessoire: 'gant' },
      { classe: 'Gardien',   equipement: 'acier',    accessoire: 'bandage' },
    ],
  ],

  // ------------------------------------------------------------------
  // JOUEURS ET CONTRÔLES
  // cote : 'gauche' = l'avant est à droite de son bloc, 'droite' = l'avant est à gauche
  // selection : quelle case choisit chaque gâchette, selon la taille du plateau
  // touches : codes KeyboardEvent.code
  // ------------------------------------------------------------------
  joueurs: [
    { nom: 'Joueur 1', couleur: '#2d5f99', couleurSombre: '#6f9fdc', cote: 'gauche',
      clavier: { gachetteGauche: 'KeyQ', gachetteDroite: 'KeyE', switch: 'KeyW', boutons: ['Digit1', 'Digit2', 'Digit3', 'Digit4'] },
      selection: {
        3: { gauche: 'arrière', aucune: 'centre', droite: 'avant' },
        2: { gauche: 'arrière', aucune: 'avant',  droite: 'avant' },
        1: { gauche: 'avant',   aucune: 'avant',  droite: 'avant' },
      } },
    { nom: 'Joueur 2', couleur: '#b83a2e', couleurSombre: '#e2685a', cote: 'droite',
      clavier: { gachetteGauche: 'KeyU', gachetteDroite: 'KeyO', switch: 'KeyI', boutons: ['Digit7', 'Digit8', 'Digit9', 'Digit0'] },
      selection: {
        3: { gauche: 'avant',   aucune: 'centre', droite: 'arrière' },
        2: { gauche: 'avant',   aucune: 'avant',  droite: 'arrière' },
        1: { gauche: 'avant',   aucune: 'avant',  droite: 'avant' },
      } },
  ],

  // Manettes (Gamepad API, mapping standard) : manette 1 = joueur 1, manette 2 = joueur 2
  manette: {
    gachetteGauche: 6, gachetteDroite: 7, seuil: 0.5,
    switch: [4, 5],                    // LB, RB
    boutons: [0, 1, 2, 3],             // A, B, X, Y -> attaques 1 à 4
    nomsBoutons: ['A', 'B', 'X', 'Y'],
  },

  // ------------------------------------------------------------------
  // IA : score = somme des poids, l'option au meilleur score est jouée
  // ------------------------------------------------------------------
  ia: {
    joueurs: [false, false],  // true = ce joueur est joué par l'IA (les deux = mode IA contre IA)
    hasard: 2,              // bruit aléatoire ajouté à chaque option (0 = IA déterministe)
    bonusKO: 6,             // si le coup met K.O. sur le plateau actuel
    soinSiBlesse: 3, seuilBlessure: 3, soinSinon: 0.5,
    defense: 2, garde: 1.5, deplacement: 0.8,
    malusFatigue: 1,
    setupParPoint: 1.2, seuilPVSetup: 0.5,   // valeur d'un point de hausse sur soi (si PV au-dessus du seuil)
    debuffParPoint: 1,                        // valeur d'un point de baisse infligé, par cible
    switchPVBas: 4, seuilPVBas: 0.34, switchSinon: 0.5, switchSiFatigue: 1,
  },

  // ------------------------------------------------------------------
  // AFFICHAGE
  // ------------------------------------------------------------------
  affichage: {
    banVisible: false,       // montre le banc (test)
    vitesseIaVsIa: 0.5,      // multiplicateur des délais quand les deux joueurs sont IA (0 = instantané)
    delais: { revelation: 700, action: 350, impact: 650, entreActions: 250, switch: 600, ko: 500, ia: 300 },
  },
};
