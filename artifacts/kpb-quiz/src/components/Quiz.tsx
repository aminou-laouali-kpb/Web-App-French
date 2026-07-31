import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { GraduationCap, ArrowLeft, Check, Search, Share2, ChevronDown, ChevronRight } from 'lucide-react';
import {
  BAREME_VERSION,
  CAPITAL_OPTIONS,
  MENSUEL_OPTIONS,
  DESTINATIONS_QUIZ,
  NATIONALITES,
  DIAL_TO_ISO,
  evaluerToutes,
  deriveLeadStatus,
  deriveOrienteVers,
  capitalLabel,
  formatFcfa,
  eurToFcfa,
  motifText,
  boursesPour,
  epargneMensuelle,
  type EvaluationResult,
  type LeadStatut,
} from '@/lib/faisabilite';

// ─── Liste des pays et indicatifs ──────────────────────────────────────────
const COUNTRY_CODES = [
  { code: '+227', flag: '🇳🇪', name: 'Niger' },
  { code: '+229', flag: '🇧🇯', name: 'Bénin' },
  { code: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: '+225', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: '+223', flag: '🇲🇱', name: 'Mali' },
  { code: '+221', flag: '🇸🇳', name: 'Sénégal' },
  { code: '+228', flag: '🇹🇬', name: 'Togo' },
  { code: '+224', flag: '🇬🇳', name: 'Guinée' },
  { code: '+222', flag: '🇲🇷', name: 'Mauritanie' },
  { code: '+237', flag: '🇨🇲', name: 'Cameroun' },
  { code: '+242', flag: '🇨🇬', name: 'Congo' },
  { code: '+243', flag: '🇨🇩', name: 'RD Congo' },
  { code: '+235', flag: '🇹🇩', name: 'Tchad' },
  { code: '+212', flag: '🇲🇦', name: 'Maroc' },
  { code: '+216', flag: '🇹🇳', name: 'Tunisie' },
  { code: '+213', flag: '🇩🇿', name: 'Algérie' },
  { code: '+33',  flag: '🇫🇷', name: 'France' },
  { code: '+32',  flag: '🇧🇪', name: 'Belgique' },
  { code: '+41',  flag: '🇨🇭', name: 'Suisse' },
  { code: '+1',   flag: '🇨🇦', name: 'Canada' },
  { code: '+44',  flag: '🇬🇧', name: 'Royaume-Uni' },
  { code: '+49',  flag: '🇩🇪', name: 'Allemagne' },
] as const;
type CountryEntry = typeof COUNTRY_CODES[number];

type Step = 'home' | 'q1' | 'q2' | 'q3' | 'q4' | 'q5a' | 'q5b' | 'contact' | 'results';

const STEPS: Step[] = ['home', 'q1', 'q2', 'q3', 'q4', 'q5a', 'q5b', 'contact', 'results'];
const TOTAL_QUESTIONS = 7;

interface QuizAnswers {
  niveau_etudes?: string;
  echeance?: string;
  destinations?: string[];
  domaine?: string;
  capital_an1?: string;
  mensuel_sur_place?: string;
  nationalite?: string;
  budget_tranche?: string;
  statut?: LeadStatut | string;
  oriente_vers?: string;
  prenom?: string;
  whatsapp?: string;
  email?: string;
  faisabilite?: EvaluationResult[];
}

const DOMAINS = [
  "Commerce / Management",
  "Finance / Comptabilité / Banque",
  "Marketing / Communication",
  "Informatique / Développement logiciel",
  "Data / Intelligence artificielle",
  "Génie civil / BTP",
  "Génie électrique / Télécoms",
  "Génie mécanique / Industriel",
  "Énergie / Mines / Pétrole",
  "Médecine / Pharmacie",
  "Sciences infirmières / Paramédical",
  "Droit / Sciences juridiques",
  "Sciences politiques / Relations internationales",
  "Économie",
  "Sciences (Maths, Physique, Chimie, Biologie)",
  "Agronomie / Agroalimentaire",
  "Architecture / Urbanisme",
  "Arts / Design / Audiovisuel",
  "Tourisme / Hôtellerie",
  "Logistique / Transport / Supply chain",
  "Autre"
];

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0
  })
};

export default function Quiz() {
  const [currentStep, setCurrentStep] = useState<Step>('home');
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [direction, setDirection] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const getStepNumber = () => {
    const map: Record<string, number> = {
      q1: 1, q2: 2, q3: 3, q4: 4, q5a: 5, q5b: 6, contact: 7,
    };
    return map[currentStep] || 0;
  };

  const advance = (nextStep: Step, message?: string) => {
    if (message) {
      setToastMessage(message);
      setTimeout(() => {
        setToastMessage(null);
        setDirection(1);
        setCurrentStep(nextStep);
      }, 600);
    } else {
      setDirection(1);
      setCurrentStep(nextStep);
    }
  };

  const goBack = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };

  const restart = () => {
    setAnswers({});
    setDirection(-1);
    setCurrentStep('home');
  };

  return (
    <div className="min-h-[100dvh] w-full flex justify-center bg-muted overflow-x-hidden font-sans text-foreground">
      <div className="w-full max-w-[480px] min-h-[100dvh] bg-background shadow-lg relative flex flex-col overflow-x-hidden">
        
        {currentStep !== 'home' && currentStep !== 'results' && (
          <div className="pt-6 pb-2 px-6 flex flex-col gap-4 relative z-10 bg-background shrink-0">
            <button 
              onClick={goBack} 
              className="text-muted-foreground hover:text-foreground w-fit p-1 -ml-1 transition-colors"
              aria-label="Retour"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-muted-foreground tracking-wide uppercase flex justify-between items-center">
                <span>Question {getStepNumber()} sur {TOTAL_QUESTIONS}</span>
                <span className="text-primary/80">{Math.round((getStepNumber() / TOTAL_QUESTIONS) * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(getStepNumber() / TOTAL_QUESTIONS) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-primary text-primary-foreground px-6 py-4 rounded-xl shadow-xl font-bold text-lg whitespace-nowrap"
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 relative min-h-0">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={currentStep}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
              className="w-full h-full flex flex-col absolute inset-0 overflow-y-auto overflow-x-hidden pb-8"
            >
              {currentStep === 'home' && (
                <HomeScreen onStart={() => advance('q1')} />
              )}
              {currentStep === 'q1' && (
                <Q1 
                  answers={answers} 
                  onSelect={(val) => {
                    setAnswers(prev => ({ ...prev, niveau_etudes: val }));
                    advance('q2', "Super ! Continuons 🎯");
                  }} 
                />
              )}
              {currentStep === 'q2' && (
                <Q2 
                  answers={answers} 
                  onSelect={(val) => {
                    setAnswers(prev => ({ ...prev, echeance: val }));
                    advance('q3', "Parfait, on avance ! ✨");
                  }} 
                />
              )}
              {currentStep === 'q3' && (
                <Q3 
                  answers={answers} 
                  onSelect={(val) => {
                    setAnswers(prev => ({ ...prev, destinations: val }));
                    advance('q4', "Excellent choix ! 🌍");
                  }} 
                />
              )}
              {currentStep === 'q4' && (
                <Q4 
                  answers={answers} 
                  onSelect={(val) => {
                    setAnswers(prev => ({ ...prev, domaine: val }));
                    advance('q5a', "Très bien ! 🎓");
                  }} 
                />
              )}
              {currentStep === 'q5a' && (
                <Q5a 
                  answers={answers} 
                  onSelect={(code) => {
                    setAnswers(prev => ({
                      ...prev,
                      capital_an1: code,
                      budget_tranche: code,
                    }));
                    advance('q5b', "Presque ! Encore une 💪");
                  }} 
                />
              )}
              {currentStep === 'q5b' && (
                <Q5b 
                  answers={answers} 
                  onSelect={(code) => {
                    setAnswers(prev => ({ ...prev, mensuel_sur_place: code }));
                    advance('contact', "Dernière étape ✍️");
                  }} 
                />
              )}
              {currentStep === 'contact' && (
                <Contact 
                  answers={answers}
                  isSubmitting={isSubmitting}
                  submitError={submitError}
                  onSubmit={async (val) => {
                    setIsSubmitting(true);
                    setSubmitError(null);

                    const evals = evaluerToutes(
                      answers.capital_an1,
                      val.nationalite,
                      answers.destinations || []
                    );
                    const statut = deriveLeadStatus(evals);
                    const oriente_vers = deriveOrienteVers(statut);

                    const finalAnswers: QuizAnswers = {
                      ...answers,
                      prenom: val.prenom,
                      whatsapp: val.whatsapp,
                      email: val.email,
                      nationalite: val.nationalite,
                      faisabilite: evals,
                      statut,
                      oriente_vers,
                      budget_tranche: answers.capital_an1,
                    };
                    setAnswers(finalAnswers);

                    const lead = {
                      prenom: finalAnswers.prenom,
                      whatsapp: finalAnswers.whatsapp,
                      email: finalAnswers.email,
                      niveau_etudes: finalAnswers.niveau_etudes,
                      echeance: finalAnswers.echeance,
                      destinations: (finalAnswers.destinations || []).join(", "),
                      domaine: finalAnswers.domaine,
                      budget_tranche: finalAnswers.capital_an1,
                      statut: finalAnswers.statut,
                      oriente_vers: finalAnswers.oriente_vers,
                      capital_an1: finalAnswers.capital_an1,
                      mensuel_sur_place: finalAnswers.mensuel_sur_place,
                      nationalite: finalAnswers.nationalite,
                      faisabilite: finalAnswers.faisabilite,
                      bareme_version: BAREME_VERSION,
                    };

                    const { error } = await supabase.rpc('submit_lead', {
                      p_prenom: lead.prenom,
                      p_whatsapp: lead.whatsapp,
                      p_email: lead.email,
                      p_niveau_etudes: lead.niveau_etudes,
                      p_echeance: lead.echeance,
                      p_destinations: lead.destinations,
                      p_domaine: lead.domaine,
                      p_budget_tranche: lead.budget_tranche,
                      p_statut: lead.statut,
                      p_oriente_vers: lead.oriente_vers,
                      p_capital_an1: lead.capital_an1,
                      p_mensuel_sur_place: lead.mensuel_sur_place,
                      p_nationalite: lead.nationalite,
                      p_faisabilite: lead.faisabilite,
                      p_bareme_version: lead.bareme_version,
                    });

                    if (error) {
                      console.error('[submit_lead] Supabase error:', error.code, error.message, error.details);
                      // Fallback sans nouveaux champs si la migration n'est pas encore appliquée
                      const { error: fallbackError } = await supabase.rpc('submit_lead', {
                        p_prenom: lead.prenom,
                        p_whatsapp: lead.whatsapp,
                        p_email: lead.email,
                        p_niveau_etudes: lead.niveau_etudes,
                        p_echeance: lead.echeance,
                        p_destinations: lead.destinations,
                        p_domaine: lead.domaine,
                        p_budget_tranche: lead.budget_tranche,
                        p_statut: lead.statut,
                        p_oriente_vers: lead.oriente_vers,
                      });
                      if (fallbackError) {
                        console.error('[submit_lead] fallback failed', fallbackError);
                        setIsSubmitting(false);
                        setSubmitError("Une erreur s'est produite lors de la soumission. Veuillez réessayer.");
                        return;
                      }
                    }

                    setIsSubmitting(false);
                    advance('results');
                    const webhookUrls = [
                      'https://n8n.kpbeducation.cloud/webhook-test/afcd381b-f3ad-4781-a629-28c1ad23086e',
                      'https://n8n.kpbeducation.cloud/webhook/afcd381b-f3ad-4781-a629-28c1ad23086e',
                    ];
                    const payload = JSON.stringify(lead);
                    webhookUrls.forEach((url) => {
                      fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: payload,
                      }).catch((err) => console.error('[webhook] Erreur envoi', url, err));
                    });
                  }} 
                />
              )}
              {currentStep === 'results' && (
                <Results answers={answers} onRestart={restart} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// --- Screens ---

function HomeScreen({ onStart }: { onStart: () => void }) {
  const [showPistes, setShowPistes] = useState(false);

  const steps = [
    "Tu réponds en 2 minutes",
    "Tu vois ce qui est à ta portée",
    "Tu passes à l'action",
  ];

  return (
    <div className="flex-1 flex flex-col min-h-[100dvh]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-gradient-to-b from-primary via-[hsl(221,83%,32%)] to-primary flex flex-col items-center justify-center px-6 pt-14 pb-8 flex-[1.1]"
      >
        <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
          <GraduationCap className="text-white" size={20} />
          <span className="text-white font-bold text-[0.95rem] tracking-wide">KPB Education</span>
        </div>

        <h1 className="text-white text-[2.1rem] leading-[1.15] font-extrabold text-center mb-4">
          Découvre ce que ta famille peut vraiment financer pour tes études
        </h1>
        <p className="text-white/85 text-[1rem] text-center font-medium leading-relaxed max-w-[320px] mb-6">
          Réponds à quelques questions et vois quelles destinations sont à ta portée — sans fausse promesse.
        </p>

        <div className="flex items-center gap-3 mb-8 flex-wrap justify-center">
          {["🇹🇳", "🇲🇦", "🇧🇪", "🇩🇪", "🇫🇷", "🇮🇪", "🇨🇦", "🇺🇸"].map((flag, i) => (
            <motion.span
              key={flag}
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05, type: "spring", stiffness: 300, damping: 15 }}
              className="text-2xl drop-shadow-sm"
            >
              {flag}
            </motion.span>
          ))}
        </div>

        <div className="flex items-start justify-center gap-5 w-full max-w-[340px] mb-8">
          {[
            { icon: "⏱️", label: "2 minutes\nchrono" },
            { icon: "🎯", label: "Verdict\nchiffré" },
            { icon: "✅", label: "100%\ngratuit" },
          ].map(b => (
            <div key={b.label} className="flex flex-col items-center gap-1.5 flex-1 text-center">
              <span className="text-2xl">{b.icon}</span>
              <span className="text-[0.78rem] font-semibold text-white/90 whitespace-pre-line leading-tight">{b.label}</span>
            </div>
          ))}
        </div>

        <motion.button
          onClick={onStart}
          data-testid="button-start"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full max-w-[360px] bg-accent text-accent-foreground py-4 rounded-2xl font-extrabold text-[1.15rem] shadow-lg shadow-black/20 flex items-center justify-center gap-2 relative overflow-hidden group"
        >
          <span className="relative z-10 flex items-center gap-2">
            Commencer le test
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              →
            </motion.span>
          </span>
        </motion.button>

        <div className="flex items-center gap-3 mt-6">
          <div className="flex -space-x-2">
            {[
              { initials: "AM", bg: "bg-blue-500" },
              { initials: "IB", bg: "bg-emerald-500" },
              { initials: "FK", bg: "bg-violet-500" },
              { initials: "SD", bg: "bg-orange-500" },
            ].map(av => (
              <div key={av.initials} className={`w-8 h-8 rounded-full ${av.bg} flex items-center justify-center text-white text-[0.65rem] font-bold ring-2 ring-primary`}>
                {av.initials}
              </div>
            ))}
          </div>
          <p className="text-[0.8rem] text-white/80 font-medium">
            <span className="text-white font-bold">+1 200</span> étudiants accompagnés
          </p>
        </div>
      </motion.div>

      <div className="bg-background flex flex-col items-center px-6 pt-6 pb-10 flex-1">
        <button
          type="button"
          onClick={() => setShowPistes(!showPistes)}
          className="w-full max-w-[360px] flex items-center justify-between bg-muted rounded-xl px-4 py-3.5 mb-4"
        >
          <span className="font-semibold text-foreground text-[0.95rem]">Comment ça marche ?</span>
          {showPistes ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>

        <AnimatePresence>
          {showPistes && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-full max-w-[360px] overflow-hidden mb-4"
            >
              <div className="bg-muted/60 rounded-xl p-4 space-y-3">
                {steps.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-[0.9rem] text-foreground font-medium">{s}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-[0.85rem] text-muted-foreground max-w-[300px] leading-relaxed">
          Pas de vente forcée : si une destination n'est pas finançable, on te le dit tout de suite.
        </p>
      </div>
    </div>
  );
}

function OptionList({
  title,
  subtitle,
  options,
  selected,
  onSelect,
}: {
  title: string;
  subtitle?: string;
  options: string[];
  selected?: string;
  onSelect: (val: string) => void;
}) {
  return (
    <div className="flex-1 flex flex-col p-6">
      <h2 className="text-[1.5rem] leading-tight font-bold text-primary mb-2">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground font-medium mb-6">{subtitle}</p>}
      <div className="flex flex-col gap-3">
        {options.map(opt => {
          const isSelected = selected === opt;
          return (
            <motion.button
              key={opt}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(opt)}
              className={`w-full p-5 border-2 rounded-xl text-left font-semibold text-foreground transition-all flex justify-between items-center ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/50 hover:bg-secondary/10'
              }`}
            >
              <span className="text-[1.05rem]">{opt}</span>
              <AnimatePresence>
                {isSelected && (
                  <motion.span
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                  >
                    <Check className="text-primary flex-shrink-0" size={20} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function Q1({ answers, onSelect }: { answers: QuizAnswers, onSelect: (val: string) => void }) {
  return (
    <OptionList
      title="Où en es-tu dans tes études ?"
      options={["Au lycée / Bac en cours", "Bac obtenu", "En licence", "Licence obtenue", "En master ou plus"]}
      selected={answers.niveau_etudes}
      onSelect={onSelect}
    />
  );
}

function Q2({ answers, onSelect }: { answers: QuizAnswers, onSelect: (val: string) => void }) {
  return (
    <OptionList
      title="Tu veux partir pour quelle rentrée ?"
      options={[
        "Janvier-février 2027 (rentrée décalée)",
        "Septembre 2027",
        "Plus tard",
        "Je ne sais pas",
      ]}
      selected={answers.echeance}
      onSelect={onSelect}
    />
  );
}

function Q3({ answers, onSelect }: { answers: QuizAnswers, onSelect: (val: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>(answers.destinations || []);

  const toggle = (id: string) => {
    if (id === "Je ne sais pas") {
       setSelected(["Je ne sais pas"]);
       return;
    }
    let newSel = selected.includes(id) ? selected.filter(d => d !== id) : [...selected, id];
    newSel = newSel.filter(d => d !== "Je ne sais pas");
    setSelected(newSel);
  };

  return (
    <div className="flex-1 flex flex-col p-6">
      <div className="mb-8">
        <h2 className="text-[1.5rem] leading-tight font-bold text-primary mb-2">Quelle destination t&apos;intéresse le plus ?</h2>
        <p className="text-sm text-muted-foreground font-medium">Tu peux choisir plusieurs pays.</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-8 items-stretch">
        {DESTINATIONS_QUIZ.map(opt => {
          const isSelected = selected.includes(opt.id);
          const isIDK = opt.id === "Je ne sais pas";
          return (
            <button 
              key={opt.id}
              onClick={() => toggle(opt.id)}
              className={`min-h-[3.5rem] h-full p-4 border-2 rounded-xl text-left font-semibold text-foreground transition-all flex items-center active:scale-[0.98] ${
                isIDK ? 'col-span-2 mt-2' : ''
              } ${
                isSelected ? 'border-primary bg-secondary/30 ring-1 ring-primary/20' : 'border-border hover:border-primary/50 hover:bg-secondary/10'
              }`}
            >
              <div className="flex justify-between items-center gap-2 w-full">
                <span className="text-[1.05rem] leading-snug">{opt.label}</span>
                {isSelected && <Check className="text-primary flex-shrink-0" size={18} />}
              </div>
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <motion.button 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => onSelect(selected)}
          className="mt-auto w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-transform active:scale-[0.98] shadow-sm sticky bottom-6"
        >
          Suivant →
        </motion.button>
      )}
    </div>
  );
}

function Q4({ answers, onSelect }: { answers: QuizAnswers, onSelect: (val: string) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const initialDomain = answers.domaine || "";
  const initialIsAutre = initialDomain.startsWith("Autre: ");
  const [selectedDomain, setSelectedDomain] = useState<string>(initialIsAutre ? "Autre" : initialDomain);
  const [autreText, setAutreText] = useState(initialIsAutre ? initialDomain.replace("Autre: ", "") : "");

  const filteredDomains = DOMAINS.filter(d => d.toLowerCase().includes(searchTerm.toLowerCase()));
  const isAutre = selectedDomain === "Autre";
  const isValid = isAutre ? autreText.trim().length > 0 : selectedDomain.length > 0;

  return (
    <div className="flex-1 flex flex-col p-6 h-full">
      <h2 className="text-[1.5rem] leading-tight font-bold text-primary mb-6">Dans quel domaine veux-tu étudier ?</h2>
      
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <input 
          type="search"
          placeholder="Rechercher un domaine..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-background border-2 border-border rounded-xl py-3.5 pl-12 pr-4 text-[1.05rem] focus:outline-none focus:border-primary transition-colors font-medium"
        />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 bg-background border border-border rounded-xl divide-y divide-border mb-6">
        {filteredDomains.map(dom => {
          const isSelected = selectedDomain === dom;
          return (
            <button
              key={dom}
              onClick={() => setSelectedDomain(dom)}
              className={`w-full text-left px-5 py-4 font-medium transition-colors flex justify-between items-center ${
                isSelected ? 'bg-secondary/40 text-primary' : 'hover:bg-muted'
              }`}
            >
              <span>{dom}</span>
              {isSelected && <Check className="text-primary flex-shrink-0" size={18} />}
            </button>
          );
        })}
        {filteredDomains.length === 0 && (
          <div className="p-6 text-center text-muted-foreground">
            Aucun domaine trouvé. Choisis &quot;Autre&quot;.
          </div>
        )}
      </div>

      {isAutre && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 overflow-hidden"
        >
          <label className="block text-sm font-semibold text-foreground mb-2">Précise ton domaine :</label>
          <input 
            type="text"
            value={autreText}
            onChange={e => setAutreText(e.target.value)}
            className="w-full bg-background border-2 border-border rounded-xl px-4 py-3.5 text-[1.05rem] focus:outline-none focus:border-primary transition-colors font-medium"
            placeholder="Ex: Architecture d'intérieur"
          />
        </motion.div>
      )}

      {isValid && (
        <motion.button 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => onSelect(isAutre ? `Autre: ${autreText}` : selectedDomain)}
          className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-transform active:scale-[0.98] shadow-sm mt-auto sticky bottom-6"
        >
          Suivant →
        </motion.button>
      )}
    </div>
  );
}

function Q5a({ answers, onSelect }: { answers: QuizAnswers, onSelect: (code: string) => void }) {
  return (
    <div className="flex-1 flex flex-col p-6">
      <div className="bg-secondary/50 border border-secondary p-5 rounded-2xl mb-6 flex gap-3 text-secondary-foreground items-start">
        <span className="text-xl">💡</span>
        <p className="text-[0.95rem] leading-relaxed font-medium">
          Le visa se décide sur le capital que ta famille peut immobiliser d&apos;un coup — pas sur un budget mensuel. Sois honnête, ça change tout.
        </p>
      </div>

      <h2 className="text-[1.35rem] leading-tight font-bold text-primary mb-2">
        Combien ta famille peut réunir en une seule fois pour la première année ?
      </h2>
      <p className="text-sm text-muted-foreground font-medium mb-6">
        Scolarité + argent à montrer au consulat
      </p>
      
      <div className="flex flex-col gap-3">
        {CAPITAL_OPTIONS.map(opt => {
          const isSelected = answers.capital_an1 === opt.code;
          return (
            <motion.button 
              key={opt.code}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(opt.code)}
              className={`w-full p-4 border-2 rounded-xl text-left transition-all flex justify-between items-center ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/50 hover:bg-secondary/10'
              }`}
            >
              <div className="flex flex-col">
                <span className="font-bold text-[1.05rem] text-foreground">{opt.primary}</span>
                {opt.secondary && <span className="text-sm font-medium text-muted-foreground mt-0.5">{opt.secondary}</span>}
              </div>
              <AnimatePresence>
                {isSelected && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Check className="text-primary flex-shrink-0" size={20} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function Q5b({ answers, onSelect }: { answers: QuizAnswers, onSelect: (code: string) => void }) {
  return (
    <div className="flex-1 flex flex-col p-6">
      <h2 className="text-[1.35rem] leading-tight font-bold text-primary mb-2">
        Et ensuite, combien par mois pour vivre sur place ?
      </h2>
      <p className="text-sm text-muted-foreground font-medium mb-6">
        Utile pour le renouvellement du visa (année 2) — ça ne bloque pas ton résultat.
      </p>
      
      <div className="flex flex-col gap-3">
        {MENSUEL_OPTIONS.map(opt => {
          const isSelected = answers.mensuel_sur_place === opt.code;
          return (
            <motion.button 
              key={opt.code}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(opt.code)}
              className={`w-full p-4 border-2 rounded-xl text-left transition-all flex justify-between items-center ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/50 hover:bg-secondary/10'
              }`}
            >
              <span className="font-bold text-[1.05rem] text-foreground">{opt.primary}</span>
              <AnimatePresence>
                {isSelected && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Check className="text-primary flex-shrink-0" size={20} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function normalizeWhatsApp(raw: string): string {
  return raw.replace(/[\s\-\.]/g, '');
}

function validateWhatsApp(raw: string): string | null {
  const cleaned = normalizeWhatsApp(raw);
  if (!/^\+[1-9][0-9]{6,14}$/.test(cleaned)) {
    return "Numéro invalide. Commence par l'indicatif pays (ex: +227 78 09 89 14 pour le Niger).";
  }
  return null;
}

function Contact({ answers, onSubmit, isSubmitting, submitError }: { 
  answers: QuizAnswers, 
  onSubmit: (val: { prenom: string, whatsapp: string, email: string, nationalite: string }) => void,
  isSubmitting: boolean,
  submitError: string | null
}) {
  const [prenom, setPrenom] = useState(answers.prenom || "");
  const [email, setEmail] = useState(answers.email || "");

  const defaultCountry = COUNTRY_CODES[0];
  const [country, setCountry] = useState<CountryEntry>(defaultCountry);
  const [localNumber, setLocalNumber] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [whatsappTouched, setWhatsappTouched] = useState(false);

  const suggestedIso = DIAL_TO_ISO[country.code] || "NE";
  const [nationalite, setNationalite] = useState(answers.nationalite || suggestedIso);
  const [nationaliteTouched, setNationaliteTouched] = useState(!!answers.nationalite);

  useEffect(() => {
    if (!nationaliteTouched) {
      setNationalite(DIAL_TO_ISO[country.code] || "NE");
    }
  }, [country.code, nationaliteTouched]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setCountrySearch("");
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredCountries = COUNTRY_CODES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.includes(countrySearch)
  );

  const fullNumber = country.code + localNumber.replace(/\s/g, '');
  const whatsappError = whatsappTouched ? validateWhatsApp(fullNumber) : null;
  const isValid = prenom.trim().length > 1
    && validateWhatsApp(fullNumber) === null
    && email.trim().length > 3
    && !!nationalite;

  const handleSubmit = () => {
    if (!isValid || isSubmitting) return;
    onSubmit({
      prenom,
      whatsapp: normalizeWhatsApp(fullNumber),
      email,
      nationalite,
    });
  };

  return (
    <div className="flex-1 flex flex-col p-6">
      <h2 className="text-[1.5rem] leading-[1.25] font-extrabold text-primary mb-6 shrink-0">
        Presque fini ! Où doit-on t&apos;envoyer tes résultats ? 🎯
      </h2>

      <div className="flex flex-col gap-5 flex-1">
        <div>
          <label className="block text-sm font-bold text-foreground mb-2">Ton prénom</label>
          <input 
            type="text"
            data-testid="input-prenom"
            value={prenom}
            onChange={e => setPrenom(e.target.value)}
            className="w-full bg-background border-2 border-border rounded-xl px-4 py-3.5 text-[1.05rem] focus:outline-none focus:border-primary transition-colors font-medium"
            placeholder="Ex: Amina"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2">Ton adresse email</label>
          <input 
            type="email"
            data-testid="input-email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-background border-2 border-border rounded-xl px-4 py-3.5 text-[1.05rem] focus:outline-none focus:border-primary transition-colors font-medium"
            placeholder="amina@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2">Ton numéro WhatsApp</label>
          <div className={`flex border-2 rounded-xl overflow-visible transition-colors ${
            whatsappError ? 'border-destructive' : 'border-border focus-within:border-primary'
          }`}>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => { setDropdownOpen(o => !o); setCountrySearch(""); }}
                className="flex items-center gap-1.5 px-3 py-3.5 bg-muted/50 border-r-2 border-border rounded-l-xl font-semibold text-[1rem] whitespace-nowrap focus:outline-none focus:bg-muted transition-colors"
              >
                <span className="text-xl">{country.flag}</span>
                <span className="text-foreground/80 text-sm">{country.code}</span>
                <ChevronDown size={14} className={`text-muted-foreground transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute left-0 top-full mt-1 w-64 bg-background border-2 border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-2 border-b border-border">
                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                      <Search size={14} className="text-muted-foreground shrink-0" />
                      <input
                        autoFocus
                        type="text"
                        value={countrySearch}
                        onChange={e => setCountrySearch(e.target.value)}
                        placeholder="Rechercher un pays…"
                        className="bg-transparent text-sm focus:outline-none w-full"
                      />
                    </div>
                  </div>
                  <ul className="max-h-52 overflow-y-auto">
                    {filteredCountries.length === 0 && (
                      <li className="px-4 py-3 text-sm text-muted-foreground">Aucun résultat</li>
                    )}
                    {filteredCountries.map((c) => (
                      <li key={c.name}>
                        <button
                          type="button"
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${
                            c.name === country.name ? 'bg-primary/10 font-bold text-primary' : ''
                          }`}
                          onClick={() => {
                            setCountry(c);
                            setDropdownOpen(false);
                            setCountrySearch("");
                          }}
                        >
                          <span className="text-lg">{c.flag}</span>
                          <span className="flex-1 text-left">{c.name}</span>
                          <span className="text-muted-foreground font-mono">{c.code}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <input
              type="tel"
              data-testid="input-whatsapp"
              value={localNumber}
              onChange={e => setLocalNumber(e.target.value)}
              onBlur={() => setWhatsappTouched(true)}
              className="flex-1 bg-transparent px-4 py-3.5 text-[1.05rem] focus:outline-none font-medium min-w-0"
              placeholder="78 09 89 14"
            />
          </div>
          {whatsappError && (
            <p className="mt-1.5 text-destructive text-[0.82rem] font-medium">{whatsappError}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2">Ta nationalité</label>
          <p className="text-xs text-muted-foreground mb-2">
            Pré-remplie selon ton indicatif — confirme ou corrige. Ça change le tarif belge.
          </p>
          <select
            data-testid="select-nationalite"
            value={nationalite}
            onChange={e => {
              setNationalite(e.target.value);
              setNationaliteTouched(true);
            }}
            className="w-full bg-background border-2 border-border rounded-xl px-4 py-3.5 text-[1.05rem] focus:outline-none focus:border-primary transition-colors font-medium"
          >
            {NATIONALITES.map(n => (
              <option key={n.iso} value={n.iso}>{n.flag} {n.label}</option>
            ))}
          </select>
        </div>

        {submitError && (
          <div className="bg-destructive/10 text-destructive text-sm font-semibold p-4 rounded-xl">
            {submitError}
          </div>
        )}

        <div className="mt-auto pt-6 sticky bottom-6">
          <button 
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            data-testid="button-submit"
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-sm flex items-center justify-center gap-2 ${
              isValid && !isSubmitting
                ? 'bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.98]' 
                : 'bg-muted text-muted-foreground cursor-not-allowed opacity-70'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                Envoi en cours...
              </span>
            ) : "Voir mes résultats →"}
          </button>
          
          <p className="mt-4 text-[0.85rem] text-muted-foreground text-center flex items-center justify-center gap-1.5 font-medium">
            🔒 On t&apos;écrit uniquement pour t&apos;aider dans ton projet d&apos;études. Tu recevras le guide PDF offert.
          </p>
        </div>
      </div>
    </div>
  );
}

function RefusalCard({
  evalItem,
  echeance,
  nearestAccessible,
}: {
  evalItem: EvaluationResult;
  echeance?: string;
  nearestAccessible?: EvaluationResult;
}) {
  const [open, setOpen] = useState(false);
  const body = motifText(evalItem.motif, evalItem.manqueFcfa);
  const monthly = epargneMensuelle(evalItem.manqueFcfa, echeance);

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-3 border-b border-amber-200/60">
        <span className="text-2xl">{evalItem.flag}</span>
        <div className="flex-1">
          <h3 className="font-extrabold text-foreground">{evalItem.nom}</h3>
          {evalItem.manqueFcfa > 0 && (
            <p className="text-amber-800 text-sm font-semibold">
              ➜ Il te manque ≈ {formatFcfa(evalItem.manqueFcfa)} FCFA
            </p>
          )}
        </div>
      </div>
      <div className="px-4 py-3 space-y-3">
        {body.split('\n\n').map((p, i) => (
          <p key={i} className="text-muted-foreground text-[0.9rem] leading-relaxed whitespace-pre-wrap">{p}</p>
        ))}

        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1 text-primary font-bold text-sm"
        >
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          Comment y arriver
        </button>

        {open && (
          <ul className="space-y-2 text-[0.88rem] text-foreground/90 bg-white/70 rounded-xl p-3 border border-amber-100">
            <li>
              <strong>Plan d&apos;épargne.</strong> En mettant {monthly} FCFA de côté par mois, tu atteins ce seuil pour la rentrée visée.
            </li>
            <li>
              <strong>Bourse.</strong> {boursesPour(evalItem.nom)}.
            </li>
            {nearestAccessible && (
              <li>
                <strong>Accessible aujourd&apos;hui :</strong> {nearestAccessible.flag} {nearestAccessible.nom}
                {" "}(ticket ≈ {formatFcfa(eurToFcfa(nearestAccessible.ticketMinEur))} – {formatFcfa(eurToFcfa(nearestAccessible.ticketMaxEur))} FCFA).
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

function Results({ answers, onRestart }: { answers: QuizAnswers, onRestart: () => void }) {
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');
  const [showAllRefusals, setShowAllRefusals] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const evals = useMemo(() => {
    if (answers.faisabilite?.length) return answers.faisabilite;
    return evaluerToutes(answers.capital_an1, answers.nationalite, answers.destinations || []);
  }, [answers.faisabilite, answers.capital_an1, answers.nationalite, answers.destinations]);

  const statut = (answers.statut as LeadStatut) || deriveLeadStatus(evals);
  const accessible = evals.filter(e => e.verdict === "accessible");

  useEffect(() => {
    if (accessible.length > 0) {
      const t = setTimeout(() => setShowConfetti(true), 600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [accessible.length]);
  const avecBourse = evals.filter(e => e.verdict === "accessible_avec_bourse");
  const chosenSet = new Set((answers.destinations || []).filter(d => d !== "Je ne sais pas"));
  // Refusals = chosen destinations that are out of reach (not the "avec bourse" ones)
  const refusals = evals.filter(e =>
    e.verdict === "hors_portee" &&
    (chosenSet.size === 0 || chosenSet.has(e.nom))
  );
  const visibleRefusals = showAllRefusals ? refusals : refusals.slice(0, 3);
  const nearestAccessible = accessible[0] || avecBourse[0];

  const domaineName = (answers.domaine || "ce domaine").replace(/^Autre: /, "");

  const profileLabels: Record<string, string> = {
    PRET: "Profil prêt ✅",
    BOURSE: "Priorité bourses 🎓",
    EPARGNE: "Plan d'épargne 📈",
    A_QUALIFIER: "À chiffrer 🔍",
  };

  const accessibleNames = accessible.map(a => `${a.flag} ${a.nom}`).join(", ");
  const shareText = accessible.length > 0
    ? `Je viens de faire le test d'orientation KPB : ma famille peut financer ${accessibleNames} 🎯 Teste gratuitement ton projet d'études à l'étranger !`
    : `Je viens de faire le test d'orientation KPB : verdict chiffré et pistes concrètes pour étudier à l'étranger 🎓 Teste-le toi aussi !`;

  const handleShare = async () => {
    const shareData = {
      title: "Test d'orientation KPB Education",
      text: shareText,
      url: window.location.href,
    };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData).catch(console.error);
    } else {
      await navigator.clipboard.writeText(shareText + " " + window.location.href).catch(console.error);
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 2500);
    }
  };

  const waShareUrl = `https://wa.me/?text=${encodeURIComponent(shareText + " " + window.location.href)}`;

  const destNames = accessible.map(a => a.nom).join(", ") || (answers.destinations || []).join(", ");
  const waPret = `https://wa.me/33768674292?text=${encodeURIComponent(
    `Bonjour KPB Education 👋 Je viens de faire le test d'orientation. Destinations accessibles : ${destNames}. Capital an 1 : ${capitalLabel(answers.capital_an1)}. Nationalité : ${answers.nationalite}. Domaine : ${answers.domaine}. Rentrée : ${answers.echeance}.`
  )}`;
  const waQualifier = `https://wa.me/33768674292?text=${encodeURIComponent(
    `Bonjour KPB Education 👋 J'ai fait le test d'orientation et je veux chiffrer mon projet. Profil : ${answers.niveau_etudes}, destinations ${(answers.destinations || []).join(", ")}, domaine ${answers.domaine}.`
  )}`;
  const waBourse = `https://wa.me/33768674292?text=${encodeURIComponent(
    "Bonjour KPB Education 👋 J'ai fait le test d'orientation et j'aimerais poser une question sur les bourses."
  )}`;

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="bg-gradient-to-br from-primary to-[hsl(221,83%,38%)] px-6 pt-8 pb-8 text-white">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-white/70 text-sm font-semibold uppercase tracking-widest mb-1"
        >
          {profileLabels[statut] || "Ton profil"}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-[1.75rem] font-extrabold leading-tight mb-3"
        >
          <span className="capitalize">{answers.prenom}</span>, voici ton verdict 🎯
        </motion.h1>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex flex-wrap gap-2"
        >
          {answers.niveau_etudes && (
            <span className="bg-white/15 rounded-full px-3 py-1 text-xs font-semibold">{answers.niveau_etudes}</span>
          )}
          {answers.domaine && (
            <span className="bg-white/15 rounded-full px-3 py-1 text-xs font-semibold">{domaineName}</span>
          )}
          {answers.echeance && (
            <span className="bg-white/15 rounded-full px-3 py-1 text-xs font-semibold">{answers.echeance}</span>
          )}
          <span className="bg-white/15 rounded-full px-3 py-1 text-xs font-semibold">
            Capital : {capitalLabel(answers.capital_an1)}
          </span>
        </motion.div>

        {/* Confetti burst for accessible results */}
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden"
          >
            {[...Array(24)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#fbbf24'][i % 6],
                  left: `${5 + (i * 4) % 90}%`,
                  top: '-5%',
                }}
                animate={{
                  y: ['0vh', '110vh'],
                  x: [0, (i % 2 === 0 ? 30 : -30)],
                  rotate: [0, 360 + i * 15],
                }}
                transition={{
                  duration: 2.2 + (i % 3) * 0.4,
                  delay: i * 0.06,
                  ease: 'easeOut',
                }}
              />
            ))}
          </motion.div>
        )}
      </div>

      <div className="p-5 pb-24 space-y-6">

        {/* Accessible first */}
        {(accessible.length > 0 || avecBourse.length > 0) && (
          <div className="space-y-3">
            <h2 className="text-[1rem] font-bold text-foreground">✅ Ce qui est à ta portée</h2>
            {[...accessible, ...avecBourse].map(dest => (
              <div key={dest.code} className="rounded-2xl overflow-hidden border border-emerald-200 shadow-sm">
                <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 px-4 py-3 flex items-center gap-3">
                  <span className="text-3xl">{dest.flag}</span>
                  <div className="flex-1">
                    <h3 className="text-white font-extrabold text-[1.1rem]">{dest.nom}</h3>
                    <p className="text-white/85 text-xs font-medium">{dest.highlight}</p>
                  </div>
                  <span className="bg-white/20 text-white text-[0.7rem] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                    {dest.verdict === "accessible_avec_bourse" ? "Avec bourse" : "Accessible"}
                  </span>
                </div>
                <div className="bg-white px-4 py-3">
                  <p className="text-muted-foreground text-[0.9rem] leading-relaxed">
                    Ticket an 1 : {formatFcfa(eurToFcfa(dest.ticketMinEur))} à {formatFcfa(eurToFcfa(dest.ticketMaxEur))} FCFA
                    {dest.fondsNature === "legal" ? " · seuil légal" : dest.fondsNature === "estime_kpb" ? " · estimation KPB" : " · fixé par l'école"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Refusals for chosen destinations */}
        {refusals.length > 0 && statut !== "A_QUALIFIER" && (
          <div className="space-y-3">
            <h2 className="text-[1rem] font-bold text-foreground">
              ⚠️ Ce que tu avais choisi, et pourquoi ce n&apos;est pas pour cette année
            </h2>
            {visibleRefusals.map(item => (
              <RefusalCard
                key={item.code}
                evalItem={item}
                echeance={answers.echeance}
                nearestAccessible={nearestAccessible}
              />
            ))}
            {refusals.length > 3 && !showAllRefusals && (
              <button
                type="button"
                onClick={() => setShowAllRefusals(true)}
                className="w-full text-center text-primary font-semibold text-sm underline underline-offset-4"
              >
                Voir les {refusals.length - 3} autres destinations
              </button>
            )}
          </div>
        )}

        {/* CTA conditionnel §7 */}
        <div className={`rounded-2xl p-5 space-y-4 ${
          statut === "EPARGNE" ? "bg-slate-50 border border-slate-200"
            : statut === "BOURSE" ? "bg-amber-50 border border-amber-200"
            : "bg-orange-50 border border-orange-200"
        }`}>
          {statut === "PRET" && (
            <>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📅</span>
                <div>
                  <h3 className="font-extrabold text-foreground text-[1.05rem] mb-1">Réserve ta consultation gratuite</h3>
                  <p className="text-muted-foreground text-[0.92rem] leading-relaxed">
                    Au moins une destination est finançable avec ton capital. Un conseiller peut étudier ton dossier avec toi.
                  </p>
                </div>
              </div>
              <a
                href={waPret}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="button-whatsapp-cta"
                className="w-full bg-accent text-accent-foreground py-4 rounded-xl font-bold text-[1.05rem] hover:bg-accent/90 transition-all active:scale-[0.98] shadow-sm flex items-center justify-center text-center gap-2"
              >
                📅 Réserver ma consultation gratuite
              </a>
            </>
          )}

          {statut === "A_QUALIFIER" && (
            <>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔍</span>
                <div>
                  <h3 className="font-extrabold text-foreground text-[1.05rem] mb-1">Chiffrons ton projet ensemble</h3>
                  <p className="text-muted-foreground text-[0.92rem] leading-relaxed">
                    Sans capital déclaré, on ne peut pas te donner un verdict fiable. Un conseiller t&apos;aide à chiffrer concrètement.
                  </p>
                </div>
              </div>
              <a
                href={waQualifier}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="button-whatsapp-cta"
                className="w-full bg-accent text-accent-foreground py-4 rounded-xl font-bold text-[1.05rem] hover:bg-accent/90 transition-all active:scale-[0.98] shadow-sm flex items-center justify-center text-center gap-2"
              >
                💬 Je veux chiffrer mon projet
              </a>
            </>
          )}

          {statut === "BOURSE" && (
            <>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎓</span>
                <div>
                  <h3 className="font-extrabold text-foreground text-[1.05rem] mb-1">Une bourse peut combler l&apos;écart</h3>
                  <p className="text-muted-foreground text-[0.92rem] leading-relaxed">
                    Ton capital est proche du seuil. Commence par la masterclass bourses — gratuite.
                  </p>
                </div>
              </div>
              <a
                href="https://webinairebourse.lovable.app"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="button-webinar-cta"
                className="w-full bg-accent text-accent-foreground py-4 rounded-xl font-bold text-[1.05rem] hover:bg-accent/90 transition-all active:scale-[0.98] shadow-sm flex items-center justify-center text-center gap-2"
              >
                🎓 Accéder à la masterclass gratuite
              </a>
              <a
                href={waBourse}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-contact-team"
                className="block text-center text-primary font-semibold text-[0.9rem] underline underline-offset-4"
              >
                Poser une question →
              </a>
            </>
          )}

          {statut === "EPARGNE" && (
            <>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📈</span>
                <div>
                  <h3 className="font-extrabold text-foreground text-[1.05rem] mb-1">On te le dit maintenant, pas après les frais</h3>
                  <p className="text-muted-foreground text-[0.92rem] leading-relaxed">
                    Cette année, aucun des pays que tu as choisis n&apos;est finançable avec ce que ta famille peut réunir — et nous préférons te le dire maintenant plutôt qu&apos;après des frais de dossier.
                  </p>
                  <p className="text-muted-foreground text-[0.92rem] leading-relaxed mt-2">
                    Deux chemins existent : <strong>la bourse</strong>, qui couvre tout ou partie des frais, et <strong>l&apos;épargne planifiée</strong> sur 12 à 24 mois. Inscris-toi au webinaire bourse, c&apos;est gratuit, et reviens faire ce test quand ta situation aura bougé.
                  </p>
                </div>
              </div>
              <a
                href="https://webinairebourse.lovable.app"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="button-webinar-cta"
                className="w-full bg-accent text-accent-foreground py-4 rounded-xl font-bold text-[1.05rem] hover:bg-accent/90 transition-all active:scale-[0.98] shadow-sm flex items-center justify-center text-center gap-2"
              >
                🎓 Webinaire bourse gratuit
              </a>
            </>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-5 space-y-3 border border-primary/10"
        >
          <div className="text-center">
            <h4 className="font-extrabold text-foreground text-[1.05rem] mb-1">Tes amis aussi peuvent trouver leur voie 🚀</h4>
            <p className="text-muted-foreground text-[0.88rem]">Partage cet outil gratuit — ils te diront merci quand ils sauront quelle destination est vraiment à leur portée.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              data-testid="button-share"
              className="flex-1 bg-background border-2 border-primary/20 text-primary py-3.5 rounded-xl font-bold text-[0.92rem] hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
            >
              {shareState === 'copied' ? (
                <><Check size={18} className="text-green-600" /> Lien copié !</>
              ) : (
                <><Share2 size={18} /> Partager</>
              )}
            </button>
            <a
              href={waShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-[#25D366] text-white py-3.5 rounded-xl font-bold text-[0.92rem] hover:bg-[#22bf5b] transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-lg">💬</span> WhatsApp
            </a>
          </div>
        </motion.div>

        <p className="text-center text-[0.7rem] text-muted-foreground">Barème {BAREME_VERSION}</p>

        <button
          onClick={onRestart}
          data-testid="button-restart"
          className="w-full text-center text-muted-foreground font-semibold text-sm underline underline-offset-4 hover:text-foreground"
        >
          Recommencer le test
        </button>
      </div>
    </div>
  );
}
