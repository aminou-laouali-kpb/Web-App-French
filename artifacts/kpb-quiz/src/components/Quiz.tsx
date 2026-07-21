import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { GraduationCap, ArrowLeft, Check, Search, Share2, Copy } from 'lucide-react';

type Step = 'home' | 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'contact' | 'results';

const STEPS: Step[] = ['home', 'q1', 'q2', 'q3', 'q4', 'q5', 'contact', 'results'];

interface QuizAnswers {
  niveau_etudes?: string;
  echeance?: string;
  destinations?: string[];
  domaine?: string;
  budget_tranche?: string;
  statut?: string;
  oriente_vers?: string;
  prenom?: string;
  whatsapp?: string;
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

const DESTINATIONS = [
  { id: "France", label: "🇫🇷 France" },
  { id: "Maroc", label: "🇲🇦 Maroc" },
  { id: "Turquie", label: "🇹🇷 Turquie" },
  { id: "Allemagne", label: "🇩🇪 Allemagne" },
  { id: "Royaume-Uni", label: "🇬🇧 Royaume-Uni" },
  { id: "USA", label: "🇺🇸 USA" },
  { id: "Dubaï", label: "🇦🇪 Dubaï" },
  { id: "Chine", label: "🇨🇳 Chine" },
  { id: "Je ne sais pas", label: "🤔 Je ne sais pas encore, aide-moi à choisir" }
];

const BUDGET_OPTIONS = [
  {
    primary: "Moins de 1 640 000 FCFA",
    secondary: "moins de 2 500 €",
    budget_tranche: "lt_2500",
    statut: "COLD",
    oriente_vers: "webinaire"
  },
  {
    primary: "1 640 000 à 2 624 000 FCFA",
    secondary: "2 500 à 4 000 €",
    budget_tranche: "2500_4000",
    statut: "STANDARD",
    oriente_vers: "whatsapp"
  },
  {
    primary: "2 624 000 à 4 592 000 FCFA",
    secondary: "4 000 à 7 000 €",
    budget_tranche: "4000_7000",
    statut: "WARM",
    oriente_vers: "whatsapp"
  },
  {
    primary: "Plus de 4 592 000 FCFA",
    secondary: "plus de 7 000 €",
    budget_tranche: "gt_7000",
    statut: "HOT",
    oriente_vers: "whatsapp"
  },
  {
    primary: "Je ne sais pas encore",
    secondary: "",
    budget_tranche: "unknown",
    statut: "A_QUALIFIER",
    oriente_vers: "whatsapp"
  }
];

const DEST_TEXTS: Record<string, string> = {
  "France": "Programmes en {domaine} reconnus mondialement. Accès aux grandes écoles et universités publiques avec des frais réduits pour les ressortissants africains.",
  "Maroc": "Destination francophone accessible, avec des universités de qualité et une vie moins chère qu'en Europe. Idéal pour un premier pas à l'étranger.",
  "Turquie": "Bourses Türkiye Bursları très compétitives qui couvrent frais de scolarité et logement. Fort développement des programmes en anglais.",
  "Allemagne": "Universités publiques sans frais de scolarité dans beaucoup de Länder. Idéal pour les profils techniques et scientifiques.",
  "Royaume-Uni": "Diplômes reconnus globalement, programmes d'un an pour les masters. Frais plus élevés mais forte valeur sur le marché du travail.",
  "USA": "Système flexible avec community colleges accessibles et bourses partielles. Fort réseau alumni mondial.",
  "Dubaï": "Hub international en forte croissance. Programmes en anglais, aucun impôt sur le revenu, opportunités de stage.",
  "Chine": "Bourses CSC (Chinese Scholarship Council) couvrant tout. Fort développement des programmes en anglais pour les étrangers."
};

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
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
    const map: Record<string, number> = { q1: 1, q2: 2, q3: 3, q4: 4, q5: 5, contact: 6 };
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
      <div className="w-full max-w-[480px] bg-background shadow-lg relative flex flex-col overflow-hidden">
        
        {/* Header (Back + Progress) */}
        {currentStep !== 'home' && currentStep !== 'results' && (
          <div className="pt-6 pb-2 px-6 flex flex-col gap-4 relative z-10 bg-background">
            <button 
              onClick={goBack} 
              className="text-muted-foreground hover:text-foreground w-fit p-1 -ml-1 transition-colors"
              aria-label="Retour"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                Question {getStepNumber()} sur 6
              </div>
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${(getStepNumber() / 6) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Micro-text Toast */}
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

        {/* Screens */}
        <div className="flex-1 relative">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={currentStep}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
              className="w-full h-full flex flex-col absolute inset-0 overflow-y-auto pb-8"
            >
              {currentStep === 'home' && (
                <Home 
                  onStart={() => advance('q1')} 
                />
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
                    advance('q5', "Très bien ! 🎓");
                  }} 
                />
              )}
              {currentStep === 'q5' && (
                <Q5 
                  answers={answers} 
                  onSelect={(val) => {
                    setAnswers(prev => ({ ...prev, ...val }));
                    advance('contact', "Presque fini ! 💪");
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
                    const finalAnswers = { ...answers, ...val };
                    setAnswers(finalAnswers);

                    const lead = {
                      prenom: finalAnswers.prenom,
                      whatsapp: finalAnswers.whatsapp,
                      niveau_etudes: finalAnswers.niveau_etudes,
                      echeance: finalAnswers.echeance,
                      destinations: (finalAnswers.destinations || []).join(", "),
                      domaine: finalAnswers.domaine,
                      budget_tranche: finalAnswers.budget_tranche,
                      statut: finalAnswers.statut,
                      oriente_vers: finalAnswers.oriente_vers,
                    };

                    const { error } = await supabase.from('leads').insert([lead]);

                    setIsSubmitting(false);
                    if (error) {
                      setSubmitError("Une erreur s'est produite lors de la soumission. Veuillez réessayer.");
                    } else {
                      advance('results');
                    }
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

function Home({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center h-full">
      <div className="flex items-center gap-3 text-primary mb-8 bg-secondary px-5 py-2.5 rounded-full">
        <GraduationCap size={28} />
        <span className="text-xl font-bold tracking-tight">KPB Education</span>
      </div>
      <h1 className="text-[1.8rem] leading-[1.15] font-extrabold text-primary mb-5">
        Découvre en 2 minutes les vraies opportunités pour partir étudier à l'étranger
      </h1>
      <p className="text-muted-foreground mb-12 text-[1.05rem] leading-relaxed max-w-sm">
        Réponds à quelques questions et reçois des pistes concrètes adaptées à ton profil. Gratuit.
      </p>
      <button 
        onClick={onStart}
        data-testid="button-start"
        className="w-full bg-accent text-accent-foreground py-4 rounded-xl font-bold text-lg hover:bg-accent/90 transition-transform active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
      >
        Commencer le test →
      </button>
      <p className="mt-6 text-sm text-muted-foreground flex items-center justify-center gap-1.5 font-medium">
        <Check size={16} className="text-green-600" /> 
        Déjà +1 200 étudiants accompagnés par KPB Education
      </p>
    </div>
  );
}

function Q1({ answers, onSelect }: { answers: QuizAnswers, onSelect: (val: string) => void }) {
  const options = ["Au lycée / Bac en cours", "Bac obtenu", "En licence", "Licence obtenue", "En master ou plus"];
  
  return (
    <div className="flex-1 flex flex-col p-6">
      <h2 className="text-[1.5rem] leading-tight font-bold text-primary mb-8">Où en es-tu dans tes études ?</h2>
      <div className="flex flex-col gap-3">
        {options.map(opt => {
          const isSelected = answers.niveau_etudes === opt;
          return (
            <button 
              key={opt}
              onClick={() => onSelect(opt)}
              className={`w-full p-5 border-2 rounded-xl text-left font-semibold text-foreground transition-all flex justify-between items-center active:scale-[0.98] ${
                isSelected ? 'border-primary bg-secondary/30' : 'border-border hover:border-primary/50 hover:bg-secondary/10'
              }`}
            >
              <span className="text-[1.05rem]">{opt}</span>
              {isSelected && <Check className="text-primary flex-shrink-0" size={20} />}
            </button>
          )
        })}
      </div>
    </div>
  );
}

function Q2({ answers, onSelect }: { answers: QuizAnswers, onSelect: (val: string) => void }) {
  const options = ["Rentrée 2026", "Rentrée 2027", "Plus tard", "Je ne sais pas encore"];
  
  return (
    <div className="flex-1 flex flex-col p-6">
      <h2 className="text-[1.5rem] leading-tight font-bold text-primary mb-8">Tu veux partir pour quelle rentrée ?</h2>
      <div className="flex flex-col gap-3">
        {options.map(opt => {
          const isSelected = answers.echeance === opt;
          return (
            <button 
              key={opt}
              onClick={() => onSelect(opt)}
              className={`w-full p-5 border-2 rounded-xl text-left font-semibold text-foreground transition-all flex justify-between items-center active:scale-[0.98] ${
                isSelected ? 'border-primary bg-secondary/30' : 'border-border hover:border-primary/50 hover:bg-secondary/10'
              }`}
            >
              <span className="text-[1.05rem]">{opt}</span>
              {isSelected && <Check className="text-primary flex-shrink-0" size={20} />}
            </button>
          )
        })}
      </div>
    </div>
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
        <h2 className="text-[1.5rem] leading-tight font-bold text-primary mb-2">Quelle destination t'intéresse le plus ?</h2>
        <p className="text-sm text-muted-foreground font-medium">Tu peux choisir plusieurs pays.</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-8">
        {DESTINATIONS.map(opt => {
          const isSelected = selected.includes(opt.id);
          const isIDK = opt.id === "Je ne sais pas";
          return (
            <button 
              key={opt.id}
              onClick={() => toggle(opt.id)}
              className={`p-4 border-2 rounded-xl text-left font-semibold text-foreground transition-all flex flex-col gap-2 active:scale-[0.98] ${
                isIDK ? 'col-span-2 mt-2' : ''
              } ${
                isSelected ? 'border-primary bg-secondary/30 ring-1 ring-primary/20' : 'border-border hover:border-primary/50 hover:bg-secondary/10'
              }`}
            >
              <div className="flex justify-between items-start w-full">
                <span className="text-[1.05rem]">{opt.label}</span>
                {isSelected && <Check className="text-primary flex-shrink-0" size={18} />}
              </div>
            </button>
          )
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
          )
        })}
        {filteredDomains.length === 0 && (
          <div className="p-6 text-center text-muted-foreground">
            Aucun domaine trouvé. Choisis "Autre".
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

function Q5({ answers, onSelect }: { answers: QuizAnswers, onSelect: (val: any) => void }) {
  return (
    <div className="flex-1 flex flex-col p-6">
      <div className="bg-secondary/50 border border-secondary p-5 rounded-2xl mb-8 flex gap-3 text-secondary-foreground items-start">
        <span className="text-xl">💡</span>
        <p className="text-[0.95rem] leading-relaxed font-medium">
          Étudier à l'étranger a un coût, mais il existe des solutions pour tous les budgets (dont des bourses). Sois honnête, ça nous aide à te proposer la meilleure piste.
        </p>
      </div>

      <h2 className="text-[1.5rem] leading-tight font-bold text-primary mb-6">Quel budget ta famille peut-elle mobiliser par an pour tes études ?</h2>
      
      <div className="flex flex-col gap-3">
        {BUDGET_OPTIONS.map(opt => {
          const isSelected = answers.budget_tranche === opt.budget_tranche;
          return (
            <button 
              key={opt.budget_tranche}
              onClick={() => onSelect({
                budget_tranche: opt.budget_tranche,
                statut: opt.statut,
                oriente_vers: opt.oriente_vers
              })}
              className={`w-full p-4 border-2 rounded-xl text-left transition-all flex justify-between items-center active:scale-[0.98] ${
                isSelected ? 'border-primary bg-secondary/30' : 'border-border hover:border-primary/50 hover:bg-secondary/10'
              }`}
            >
              <div className="flex flex-col">
                <span className="font-bold text-[1.05rem] text-foreground">{opt.primary}</span>
                {opt.secondary && <span className="text-sm font-medium text-muted-foreground mt-0.5">{opt.secondary}</span>}
              </div>
              {isSelected && <Check className="text-primary flex-shrink-0" size={20} />}
            </button>
          )
        })}
      </div>
    </div>
  );
}

function Contact({ answers, onSubmit, isSubmitting, submitError }: { 
  answers: QuizAnswers, 
  onSubmit: (val: { prenom: string, whatsapp: string }) => void,
  isSubmitting: boolean,
  submitError: string | null
}) {
  const [prenom, setPrenom] = useState(answers.prenom || "");
  const [whatsapp, setWhatsapp] = useState(answers.whatsapp || "+227 ");

  const isValid = prenom.trim().length > 1 && whatsapp.trim().length > 6;

  return (
    <div className="flex-1 flex flex-col p-6">
      <h2 className="text-[1.75rem] leading-[1.2] font-extrabold text-primary mb-8">
        Presque fini ! Où doit-on t'envoyer tes résultats et tes pistes ? 🎯
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
          <label className="block text-sm font-bold text-foreground mb-2">Ton numéro WhatsApp</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none">
              🇳🇪
            </div>
            <input 
              type="tel"
              data-testid="input-whatsapp"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              className="w-full bg-background border-2 border-border rounded-xl pl-12 pr-4 py-3.5 text-[1.05rem] focus:outline-none focus:border-primary transition-colors font-medium"
            />
          </div>
        </div>

        {submitError && (
          <div className="bg-destructive/10 text-destructive text-sm font-semibold p-4 rounded-xl">
            {submitError}
          </div>
        )}

        <div className="mt-auto pt-6 sticky bottom-6">
          <button 
            onClick={() => isValid && !isSubmitting && onSubmit({ prenom, whatsapp })}
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
            🔒 On t'écrit uniquement pour t'aider dans ton projet d'études.
          </p>
        </div>
      </div>
    </div>
  );
}

function Results({ answers, onRestart }: { answers: QuizAnswers, onRestart: () => void }) {
  const [showCopied, setShowCopied] = useState(false);

  // Determine destinations to show
  let toShow = answers.destinations || [];
  if (toShow.includes("Je ne sais pas") || toShow.length === 0) {
    toShow = ["France", "Maroc", "Turquie"];
  }
  // Max 4 cards
  toShow = toShow.slice(0, 4);

  // Extract flag and country name from options
  const getCountryInfo = (id: string) => {
    const opt = DESTINATIONS.find(d => d.id === id);
    if (!opt) return { flag: "🌍", name: id };
    const parts = opt.label.split(" ");
    return { flag: parts[0], name: parts.slice(1).join(" ") };
  };

  const domaineName = (answers.domaine || "ce domaine").replace(/^Autre: /, "");

  const handleShare = () => {
    const shareData = {
      title: "Test d'orientation KPB Education",
      text: "Je viens de tester cet outil gratuit pour trouver des opportunités d'études à l'étranger 🎓 Teste-le toi aussi :",
      url: window.location.href,
    };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-full">
      {/* Banner */}
      {answers.echeance === "Rentrée 2026" && (
        <div className="bg-[#fff7ed] border-b border-[#fed7aa] text-[#c2410c] px-4 py-3 text-sm font-bold text-center">
          ⏰ Les dates limites pour la rentrée 2026 approchent — ne tarde pas !
        </div>
      )}

      <div className="p-6 pb-20 space-y-8">
        <h1 className="text-[1.75rem] leading-[1.2] font-extrabold text-primary">
          <span className="capitalize">{answers.prenom}</span>, voici les pistes réelles pour toi 🎯
        </h1>

        {/* Destination Cards */}
        <div className="space-y-4">
          {toShow.map(dest => {
            const info = getCountryInfo(dest);
            let desc = DEST_TEXTS[dest] || `Excellentes opportunités en ${info.name}.`;
            desc = desc.replace("{domaine}", domaineName);

            return (
              <div key={dest} className="bg-secondary/20 border border-secondary-border p-5 rounded-2xl flex gap-4">
                <div className="text-3xl leading-none pt-1">{info.flag}</div>
                <div>
                  <h3 className="font-bold text-foreground text-[1.1rem] mb-1">{info.name}</h3>
                  <p className="text-muted-foreground text-[0.95rem] leading-relaxed font-medium">
                    {desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="h-px bg-border w-full my-6"></div>

        {/* Action Section */}
        <div className="space-y-5">
          {answers.oriente_vers === "webinaire" ? (
            <>
              <p className="text-foreground text-[1.05rem] leading-relaxed font-medium">
                Il existe des bourses qui peuvent alléger fortement, voire couvrir, le coût de tes études à l'étranger. La meilleure première étape pour toi : notre masterclass gratuite sur les bourses.
              </p>
              <a 
                href="https://webinairebourse.lovable.app"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="button-webinar-cta"
                className="w-full bg-accent text-accent-foreground py-4 rounded-xl font-bold text-[1.05rem] hover:bg-accent/90 transition-transform active:scale-[0.98] shadow-sm flex items-center justify-center text-center px-4"
              >
                🎓 Accéder à la masterclass gratuite
              </a>
              <a 
                href={`https://wa.me/33768674292?text=${encodeURIComponent("Bonjour KPB Education 👋 J'ai fait le test d'orientation et j'aimerais des informations sur les bourses et l'accompagnement.")}`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-contact-team"
                className="block text-center text-primary font-semibold text-[0.95rem] underline underline-offset-4 hover:text-primary/80"
              >
                Tu préfères parler à quelqu'un ? Contacte l'équipe
              </a>
            </>
          ) : (
            <>
              <p className="text-foreground text-[1.05rem] leading-relaxed font-medium">
                Ton profil correspond aux programmes que KPB Education accompagne. Un conseiller peut étudier ton dossier avec toi et t'aider à monter ta candidature.
              </p>
              <a 
                href={`https://wa.me/33768674292?text=${encodeURIComponent(`Bonjour KPB Education 👋 Je viens de faire le test d'orientation et j'aimerais réserver ma consultation gratuite. Mon profil : ${answers.niveau_etudes}, destination ${(answers.destinations || []).join(", ")}, rentrée ${answers.echeance}, domaine ${answers.domaine}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="button-whatsapp-cta"
                className="w-full bg-accent text-accent-foreground py-4 rounded-xl font-bold text-[1.05rem] hover:bg-accent/90 transition-transform active:scale-[0.98] shadow-sm flex items-center justify-center text-center px-4"
              >
                📅 Réserver ma consultation gratuite
              </a>
            </>
          )}
        </div>

        <div className="h-px bg-border w-full my-6"></div>

        {/* Share Section */}
        <div className="bg-muted/50 p-6 rounded-2xl text-center space-y-4">
          <h4 className="font-bold text-foreground">Tes amis aussi peuvent trouver leur voie</h4>
          
          <button
            onClick={handleShare}
            data-testid="button-share"
            className="w-full bg-background border-2 border-border text-foreground py-3.5 rounded-xl font-bold text-[0.95rem] hover:bg-secondary/20 transition-colors flex items-center justify-center gap-2"
          >
            {showCopied ? (
              <><Check size={18} className="text-green-600" /> Lien copié !</>
            ) : (
              <><Share2 size={18} /> Partager cet outil</>
            )}
          </button>
        </div>

        <button 
          onClick={onRestart}
          data-testid="button-restart"
          className="w-full text-center text-muted-foreground font-semibold text-sm underline underline-offset-4 hover:text-foreground mt-8"
        >
          Recommencer le test
        </button>
      </div>
    </div>
  );
}
