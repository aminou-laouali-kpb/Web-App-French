/** Moteur de faisabilité KPB Quiz — barème 2026-08 */

export const BAREME_VERSION = "2026-08";
export const EUR_TO_FCFA = 655.957;

export type Verdict = "accessible" | "accessible_avec_bourse" | "hors_portee" | "a_qualifier";
export type LeadStatut = "PRET" | "BOURSE" | "EPARGNE" | "A_QUALIFIER";
export type OrienteVers = "whatsapp" | "webinaire" | "epargne";

export interface DestinationCout {
  code: string;
  nom: string;
  flag: string;
  /** Borne basse du ticket d'entrée en € */
  ticketMinEur: number;
  ticketMaxEur: number;
  fondsNature: "legal" | "estime_kpb" | "fixe_par_ecole";
  boursesPartielles: boolean;
  motifPrincipal: string;
  /** Highlight court pour carte accessible */
  highlight: string;
  exemptionRegle?: "PMA_ARES";
  ticketMinEurHorsPma?: number;
}

export interface EvaluationResult {
  code: string;
  nom: string;
  flag: string;
  verdict: Verdict;
  manqueFcfa: number;
  motif: string | null;
  ticketMinEur: number;
  ticketMaxEur: number;
  fondsNature: DestinationCout["fondsNature"];
  highlight: string;
}

/** Capital an 1 → borne basse en € (null = inconnu) */
export const CAPITAL_OPTIONS: {
  code: string;
  primary: string;
  secondary: string;
  capitalMinEur: number | null;
}[] = [
  { code: "lt_4000", primary: "Moins de 2,6 millions FCFA", secondary: "moins de 4 000 €", capitalMinEur: 0 },
  { code: "4000_8000", primary: "2,6 à 5,2 millions FCFA", secondary: "4 000 – 8 000 €", capitalMinEur: 4000 },
  { code: "8000_12000", primary: "5,2 à 7,9 millions FCFA", secondary: "8 000 – 12 000 €", capitalMinEur: 8000 },
  { code: "12000_15000", primary: "7,9 à 9,8 millions FCFA", secondary: "12 000 – 15 000 €", capitalMinEur: 12000 },
  { code: "15000_20000", primary: "9,8 à 13,1 millions FCFA", secondary: "15 000 – 20 000 €", capitalMinEur: 15000 },
  { code: "20000_27000", primary: "13,1 à 17,7 millions FCFA", secondary: "20 000 – 27 000 €", capitalMinEur: 20000 },
  { code: "gt_27000", primary: "Plus de 17,7 millions FCFA", secondary: "plus de 27 000 €", capitalMinEur: 27000 },
  { code: "unknown", primary: "Je ne sais pas encore", secondary: "", capitalMinEur: null },
];

export const MENSUEL_OPTIONS: { code: string; primary: string; secondary?: string }[] = [
  { code: "lt_150k", primary: "Moins de 150 000 FCFA / mois" },
  { code: "150k_300k", primary: "150 000 à 300 000 FCFA / mois" },
  { code: "300k_500k", primary: "300 000 à 500 000 FCFA / mois" },
  { code: "gt_500k", primary: "Plus de 500 000 FCFA / mois" },
  { code: "unknown", primary: "Je ne sais pas encore" },
];

/** Liste PMA (annexe 1 ARES — cœur marché KPB + voisins) */
export const PMA_ISO = new Set([
  "NE", "ML", "BF", "TD", "GN", "SN", "TG", "BJ", "CD", "CF", "MR",
  "GW", "LR", "SL", "SS", "SO", "ER", "ET", "DJ", "MG", "KM", "RW", "BI", "UG", "MZ", "MW", "ZM", "AO",
]);

export const NATIONALITES: { iso: string; label: string; flag: string }[] = [
  { iso: "NE", label: "Niger", flag: "🇳🇪" },
  { iso: "BJ", label: "Bénin", flag: "🇧🇯" },
  { iso: "BF", label: "Burkina Faso", flag: "🇧🇫" },
  { iso: "CI", label: "Côte d'Ivoire", flag: "🇨🇮" },
  { iso: "ML", label: "Mali", flag: "🇲🇱" },
  { iso: "SN", label: "Sénégal", flag: "🇸🇳" },
  { iso: "TG", label: "Togo", flag: "🇹🇬" },
  { iso: "GN", label: "Guinée", flag: "🇬🇳" },
  { iso: "MR", label: "Mauritanie", flag: "🇲🇷" },
  { iso: "CM", label: "Cameroun", flag: "🇨🇲" },
  { iso: "CG", label: "Congo", flag: "🇨🇬" },
  { iso: "CD", label: "RD Congo", flag: "🇨🇩" },
  { iso: "TD", label: "Tchad", flag: "🇹🇩" },
  { iso: "CF", label: "Centrafrique", flag: "🇨🇫" },
  { iso: "GA", label: "Gabon", flag: "🇬🇦" },
  { iso: "MA", label: "Maroc", flag: "🇲🇦" },
  { iso: "TN", label: "Tunisie", flag: "🇹🇳" },
  { iso: "DZ", label: "Algérie", flag: "🇩🇿" },
  { iso: "FR", label: "France", flag: "🇫🇷" },
  { iso: "OTHER", label: "Autre", flag: "🌍" },
];

/** Indicatif WhatsApp → ISO nationalité suggérée (à confirmer) */
export const DIAL_TO_ISO: Record<string, string> = {
  "+227": "NE",
  "+229": "BJ",
  "+226": "BF",
  "+225": "CI",
  "+223": "ML",
  "+221": "SN",
  "+228": "TG",
  "+224": "GN",
  "+222": "MR",
  "+237": "CM",
  "+242": "CG",
  "+243": "CD",
  "+235": "TD",
  "+236": "CF",
  "+241": "GA",
  "+212": "MA",
  "+216": "TN",
  "+213": "DZ",
  "+33": "FR",
};

export const DESTINATIONS_QUIZ: { id: string; label: string }[] = [
  { id: "Tunisie", label: "🇹🇳 Tunisie" },
  { id: "Maroc", label: "🇲🇦 Maroc" },
  { id: "Belgique", label: "🇧🇪 Belgique" },
  { id: "Allemagne", label: "🇩🇪 Allemagne" },
  { id: "France", label: "🇫🇷 France" },
  { id: "Irlande", label: "🇮🇪 Irlande" },
  { id: "Canada", label: "🇨🇦 Canada (hors Québec)" },
  { id: "Québec", label: "⚜️ Québec" },
  { id: "USA", label: "🇺🇸 USA" },
  { id: "Je ne sais pas", label: "🤔 Je ne sais pas encore, aide-moi à choisir" },
];

export const DESTINATIONS_COUTS: DestinationCout[] = [
  {
    code: "tunisie",
    nom: "Tunisie",
    flag: "🇹🇳",
    ticketMinEur: 4400,
    ticketMaxEur: 7900,
    fondsNature: "estime_kpb",
    boursesPartielles: true,
    motifPrincipal: "tn_estime",
    highlight: "Privé · pas de compte bloqué exigé",
  },
  {
    code: "maroc",
    nom: "Maroc",
    flag: "🇲🇦",
    ticketMinEur: 6400,
    ticketMaxEur: 11100,
    fondsNature: "estime_kpb",
    boursesPartielles: true,
    motifPrincipal: "ma_estime",
    highlight: "Privé · pas de compte bloqué exigé",
  },
  {
    code: "belgique",
    nom: "Belgique",
    flag: "🇧🇪",
    ticketMinEur: 13600,
    ticketMaxEur: 13900,
    ticketMinEurHorsPma: 18100,
    fondsNature: "legal",
    boursesPartielles: true,
    motifPrincipal: "be_fonds",
    highlight: "Public · exemption PMA possible",
    exemptionRegle: "PMA_ARES",
  },
  {
    code: "allemagne",
    nom: "Allemagne",
    flag: "🇩🇪",
    ticketMinEur: 12200,
    ticketMaxEur: 12700,
    fondsNature: "legal",
    boursesPartielles: true,
    motifPrincipal: "de_sperrkonto",
    highlight: "Public · Sperrkonto (avance, pas une dépense)",
  },
  {
    code: "france",
    nom: "France",
    flag: "🇫🇷",
    ticketMinEur: 10800,
    ticketMaxEur: 14400,
    fondsNature: "legal",
    boursesPartielles: true,
    motifPrincipal: "fr_ressources",
    highlight: "Public · 877,50 €/mois à justifier",
  },
  {
    code: "irlande",
    nom: "Irlande",
    flag: "🇮🇪",
    ticketMinEur: 21300,
    ticketMaxEur: 26000,
    fondsNature: "legal",
    boursesPartielles: false,
    motifPrincipal: "ie_prepaiement",
    highlight: "6 000 € à décaisser avant le visa",
  },
  {
    code: "canada",
    nom: "Canada",
    flag: "🇨🇦",
    ticketMinEur: 24700,
    ticketMaxEur: 41000,
    fondsNature: "legal",
    boursesPartielles: false,
    motifPrincipal: "ca_lico",
    highlight: "Hors Québec · attestation provinciale requise",
  },
  {
    code: "quebec",
    nom: "Québec",
    flag: "⚜️",
    ticketMinEur: 25700,
    ticketMaxEur: 42000,
    fondsNature: "legal",
    boursesPartielles: false,
    motifPrincipal: "qc_capacite",
    highlight: "24 617 $ CA de frais de vie depuis 2026",
  },
  {
    code: "usa",
    nom: "USA",
    flag: "🇺🇸",
    ticketMinEur: 27000,
    ticketMaxEur: 50000,
    fondsNature: "fixe_par_ecole",
    boursesPartielles: false,
    motifPrincipal: "us_i20",
    highlight: "Montant fixé par l'école (I-20)",
  },
];

const NOM_TO_CODE: Record<string, string> = Object.fromEntries(
  DESTINATIONS_COUTS.map((d) => [d.nom, d.code])
);

export function formatFcfa(amount: number): string {
  const rounded = Math.round(amount / 100_000) * 100_000;
  return rounded.toLocaleString("fr-FR");
}

export function eurToFcfa(eur: number): number {
  return eur * EUR_TO_FCFA;
}

export function capitalMinFromCode(code: string | undefined): number | null {
  const opt = CAPITAL_OPTIONS.find((o) => o.code === code);
  return opt ? opt.capitalMinEur : null;
}

export function capitalLabel(code: string | undefined): string {
  const opt = CAPITAL_OPTIONS.find((o) => o.code === code);
  return opt?.primary ?? "Non renseigné";
}

function ticketFor(dest: DestinationCout, nationalite: string | undefined): { min: number; max: number; motif: string } {
  if (dest.exemptionRegle === "PMA_ARES") {
    const isPma = !!nationalite && PMA_ISO.has(nationalite);
    if (isPma) {
      return { min: dest.ticketMinEur, max: dest.ticketMaxEur, motif: "be_fonds" };
    }
    return {
      min: dest.ticketMinEurHorsPma ?? dest.ticketMinEur,
      max: dest.ticketMinEurHorsPma ?? dest.ticketMaxEur,
      motif: "be_dis",
    };
  }
  return { min: dest.ticketMinEur, max: dest.ticketMaxEur, motif: dest.motifPrincipal };
}

export function evaluerDestination(
  dest: DestinationCout,
  capitalMinEur: number | null,
  nationalite: string | undefined
): EvaluationResult {
  const ticket = ticketFor(dest, nationalite);

  if (capitalMinEur === null) {
    return {
      code: dest.code,
      nom: dest.nom,
      flag: dest.flag,
      verdict: "a_qualifier",
      manqueFcfa: 0,
      motif: "capital_inconnu",
      ticketMinEur: ticket.min,
      ticketMaxEur: ticket.max,
      fondsNature: dest.fondsNature,
      highlight: dest.highlight,
    };
  }

  if (capitalMinEur >= ticket.min) {
    return {
      code: dest.code,
      nom: dest.nom,
      flag: dest.flag,
      verdict: "accessible",
      manqueFcfa: 0,
      motif: null,
      ticketMinEur: ticket.min,
      ticketMaxEur: ticket.max,
      fondsNature: dest.fondsNature,
      highlight: dest.highlight,
    };
  }

  const manqueEur = ticket.min - capitalMinEur;
  const manqueFcfa = Math.round(eurToFcfa(manqueEur) / 100_000) * 100_000;

  if (manqueEur <= ticket.min * 0.4 && dest.boursesPartielles) {
    return {
      code: dest.code,
      nom: dest.nom,
      flag: dest.flag,
      verdict: "accessible_avec_bourse",
      manqueFcfa,
      motif: "ecart_comblable",
      ticketMinEur: ticket.min,
      ticketMaxEur: ticket.max,
      fondsNature: dest.fondsNature,
      highlight: dest.highlight,
    };
  }

  return {
    code: dest.code,
    nom: dest.nom,
    flag: dest.flag,
    verdict: "hors_portee",
    manqueFcfa,
    motif: ticket.motif,
    ticketMinEur: ticket.min,
    ticketMaxEur: ticket.max,
    fondsNature: dest.fondsNature,
    highlight: dest.highlight,
  };
}

export function evaluerToutes(
  capitalCode: string | undefined,
  nationalite: string | undefined,
  chosenNoms: string[]
): EvaluationResult[] {
  const capitalMin = capitalMinFromCode(capitalCode);
  const chosenCodes = new Set(
    chosenNoms
      .filter((n) => n !== "Je ne sais pas")
      .map((n) => NOM_TO_CODE[n])
      .filter(Boolean)
  );

  // Si "je ne sais pas" ou aucune sélection → évaluer toutes
  const list =
    chosenCodes.size === 0
      ? DESTINATIONS_COUTS
      : DESTINATIONS_COUTS.filter((d) => chosenCodes.has(d.code));

  // Toujours aussi proposer les accessibles hors choix si rien d'accessible parmi les choix
  const evaluated = list.map((d) => evaluerDestination(d, capitalMin, nationalite));

  if (chosenCodes.size > 0) {
    const hasAccessible = evaluated.some((e) => e.verdict === "accessible");
    if (!hasAccessible && capitalMin !== null) {
      const alternatives = DESTINATIONS_COUTS
        .filter((d) => !chosenCodes.has(d.code))
        .map((d) => evaluerDestination(d, capitalMin, nationalite))
        .filter((e) => e.verdict === "accessible" || e.verdict === "accessible_avec_bourse");
      return [...evaluated, ...alternatives];
    }
  }

  return evaluated;
}

export function deriveLeadStatus(evals: EvaluationResult[]): LeadStatut {
  if (evals.some((e) => e.verdict === "a_qualifier") && evals.every((e) => e.verdict === "a_qualifier")) {
    return "A_QUALIFIER";
  }
  if (evals.some((e) => e.verdict === "accessible")) return "PRET";
  if (evals.some((e) => e.verdict === "accessible_avec_bourse")) return "BOURSE";
  if (evals.every((e) => e.verdict === "a_qualifier")) return "A_QUALIFIER";
  return "EPARGNE";
}

export function deriveOrienteVers(statut: LeadStatut): OrienteVers {
  switch (statut) {
    case "PRET":
    case "A_QUALIFIER":
      return "whatsapp";
    case "BOURSE":
      return "webinaire";
    case "EPARGNE":
      return "epargne";
  }
}

/** Textes de refus §6 */
export function motifText(motif: string | null, manqueFcfa: number): string {
  const manque = formatFcfa(manqueFcfa);
  switch (motif) {
    case "fr_ressources":
      return `Depuis le 1ᵉʳ août 2026, la France exige de justifier 877,50 € par mois, soit 10 530 € (6 907 000 FCFA) pour l'année, en plus des frais de scolarité. Ce seuil a augmenté de 43 % cet été. Et depuis juillet, les étudiants étrangers non boursiers n'ont plus droit aux aides au logement.\n\nIl te manque environ ${manque} FCFA.`;
    case "be_fonds":
      return `Bonne nouvelle d'abord : avec ta nationalité, tu es exempté de la contribution supplémentaire de 4 175 € que paient les autres étudiants hors Europe. Ta scolarité en Belgique publique tomberait autour de 1 200 € l'année — c'est moins cher que la France.\n\nCe qui bloque n'est pas la scolarité mais l'argent à montrer : 1 062 € par mois, soit 12 744 € (8 359 000 FCFA) à bloquer sur un compte pour l'année 2026-2027.\n\nIl te manque environ ${manque} FCFA.`;
    case "be_dis":
      return `La Belgique demande, pour ta nationalité, 5 369 € de frais annuels (droit d'inscription + contribution supplémentaire de 4 175 €), plus 12 744 € à justifier pour vivre sur place. Soit environ 11 900 000 FCFA pour la première année.\n\nUne exception existe : l'exemption de contribution supplémentaire s'applique dans certaines universités selon la nationalité. C'est à vérifier dossier par dossier.\n\nIl te manque environ ${manque} FCFA.`;
    case "de_sperrkonto":
      return `En Allemagne publique, la scolarité est gratuite dans 15 Länder sur 16 — tu ne paies que 150 à 400 € par semestre, transport inclus. Le vrai obstacle est le compte bloqué : 11 904 € (7 809 000 FCFA) à verser d'avance.\n\nRetiens ceci : cet argent n'est pas perdu, il te revient à raison de 992 € par mois une fois sur place. C'est une avance, pas une dépense.\n\nIl te manque environ ${manque} FCFA.`;
    case "ie_prepaiement":
      return `L'Irlande cumule deux exigences : 10 000 € (6 560 000 FCFA) de frais de vie à justifier, et une scolarité de 11 300 à 16 000 € dont 6 000 € doivent être payés avant que le visa ne soit accordé. Autrement dit, il faut sortir cet argent sans savoir encore si le visa passera.\n\nIl te manque environ ${manque} FCFA.`;
    case "ca_lico":
    case "qc_capacite":
      return `Le Canada exige 22 895 $ CA de frais de subsistance pour la première année, en plus de la scolarité et du billet. Au Québec, c'est 24 617 $ CA depuis janvier 2026 — près de 10 000 $ de hausse en un an. Il faut aussi une lettre d'attestation provinciale, et le traitement prend 8 à 12 semaines.\n\nIl te manque environ ${manque} FCFA.`;
    case "us_i20":
      return `Aux États-Unis, il n'y a pas de barème national : c'est l'université qui fixe le montant sur ton I-20, et tes justificatifs doivent correspondre exactement à ce chiffre. En pratique, les dossiers réalistes commencent autour de 17 700 000 FCFA pour la première année.\n\nIl te manque environ ${manque} FCFA.`;
    case "ecart_comblable":
      return `Tu n'es pas loin : l'écart peut être comblé par une bourse partielle ou un plan d'épargne ciblé.\n\nIl te manque environ ${manque} FCFA.`;
    case "tn_estime":
    case "ma_estime":
      return `Pour cette destination, le ticket d'entrée estimé dépasse ce que ta famille peut réunir en une seule fois pour la première année.\n\nIl te manque environ ${manque} FCFA.`;
    default:
      return manqueFcfa > 0
        ? `Il te manque environ ${manque} FCFA pour atteindre le seuil de la première année.`
        : "Capital à préciser pour un verdict chiffré.";
  }
}

export function boursesPour(nom: string): string {
  switch (nom) {
    case "Maroc":
      return "AMCI (Agence Marocaine de Coopération Internationale)";
    case "Belgique":
      return "ARES et Wallonie-Bruxelles International";
    case "Allemagne":
      return "DAAD";
    case "France":
      return "Campus France / bourses d'excellence Eiffel (master)";
    case "Tunisie":
      return "Bourses bilatérales et aides établissement";
    default:
      return "Bourses internationales ciblées selon ton dossier";
  }
}

export function moisRestants(echeance: string | undefined): number {
  const now = new Date();
  let target = new Date(now.getFullYear() + 1, 8, 1); // sept N+1 par défaut
  if (echeance?.includes("Janvier") || echeance?.includes("février") || echeance?.includes("fevrier")) {
    target = new Date(2027, 0, 15);
  } else if (echeance?.includes("Septembre 2027")) {
    target = new Date(2027, 8, 1);
  } else if (echeance?.includes("Plus tard")) {
    target = new Date(2028, 8, 1);
  }
  const months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  return Math.max(months, 6);
}

export function epargneMensuelle(manqueFcfa: number, echeance: string | undefined): string {
  const months = moisRestants(echeance);
  const perMonth = Math.round(manqueFcfa / months / 10_000) * 10_000;
  return formatFcfa(Math.max(perMonth, 10_000));
}
