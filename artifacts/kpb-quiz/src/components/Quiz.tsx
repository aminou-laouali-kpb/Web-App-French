import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { GraduationCap, ArrowLeft, Check, Search, Share2, Copy, ChevronDown } from 'lucide-react';

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
  { code: '+212', flag: '🇲🇦', name: 'Maroc' },
  { code: '+216', flag: '🇹🇳', name: 'Tunisie' },
  { code: '+213', flag: '🇩🇿', name: 'Algérie' },
  { code: '+33',  flag: '🇫🇷', name: 'France' },
  { code: '+32',  flag: '🇧🇪', name: 'Belgique' },
  { code: '+41',  flag: '🇨🇭', name: 'Suisse' },
  { code: '+1',   flag: '🇨🇦', name: 'Canada' },
  { code: '+1',   flag: '🇺🇸', name: 'États-Unis' },
  { code: '+44',  flag: '🇬🇧', name: 'Royaume-Uni' },
  { code: '+49',  flag: '🇩🇪', name: 'Allemagne' },
  { code: '+34',  flag: '🇪🇸', name: 'Espagne' },
  { code: '+351', flag: '🇵🇹', name: 'Portugal' },
] as const;
type CountryEntry = typeof COUNTRY_CODES[number];

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
  email?: string;
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
  { id: "Canada", label: "🇨🇦 Canada" },
  { id: "Je ne sais pas", label: "🤔 Je ne sais pas encore, aide-moi à choisir" }
];

const BUDGET_DESTINATIONS: Record<string, string[]> = {
  "gt_7000":    ["Canada", "USA", "Dubaï", "Allemagne", "France"],
  "4000_7000":  ["Maroc", "Turquie"],
  "2500_4000":  ["Maroc"],
  "lt_2500":    [],           // COLD — no destination cards
  "unknown":    [],           // A_QUALIFIER — use student's choices or default
};

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
  "Chine": "Bourses CSC (Chinese Scholarship Council) couvrant tout. Fort développement des programmes en anglais pour les étrangers.",
  "Canada": "Universités de rang mondial avec un accueil reconnu des étudiants internationaux. Passerelle vers l'immigration permanente et marché du travail dynamique."
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
                <HomeScreen 
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
                    const finalAnswers = { ...answers, prenom: val.prenom, whatsapp: val.whatsapp, email: val.email };
                    setAnswers(finalAnswers);

                    const lead = {
                      prenom: finalAnswers.prenom,
                      whatsapp: finalAnswers.whatsapp,
                      email: finalAnswers.email,
                      niveau_etudes: finalAnswers.niveau_etudes,
                      echeance: finalAnswers.echeance,
                      destinations: (finalAnswers.destinations || []).join(", "),
                      domaine: finalAnswers.domaine,
                      budget_tranche: finalAnswers.budget_tranche,
                      statut: finalAnswers.statut,
                      oriente_vers: finalAnswers.oriente_vers,
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
                    });

                    setIsSubmitting(false);
                    if (error) {
                      console.error('[submit_lead] Supabase error:', error.code, error.message, error.details);
                      setSubmitError("Une erreur s'est produite lors de la soumission. Veuillez réessayer.");
                    } else {
                      advance('results');
                      // Envoyer les données du lead aux webhooks n8n (sans bloquer l'affichage)
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

function HomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex-1 flex flex-col min-h-[100dvh]">
      {/* Top hero — primary blue */}
      <div className="bg-primary flex flex-col items-center justify-center px-6 pt-14 pb-10 flex-[1.1]">
        {/* Logo badge */}
        <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
          <GraduationCap className="text-white" size={20} />
          <span className="text-white font-bold text-[0.95rem] tracking-wide">KPB Education</span>
        </div>

        <h1 className="text-white text-[2rem] leading-[1.15] font-extrabold text-center mb-4">
          Découvre tes vraies opportunités pour étudier à l'étranger
        </h1>
        <p className="text-white/80 text-[1rem] text-center font-medium leading-relaxed max-w-[320px]">
          Réponds à 6 questions et reçois des pistes concrètes et gratuites adaptées à ton profil.
        </p>

        {/* Country flags strip */}
        <div className="flex items-center gap-3 mt-8 flex-wrap justify-center">
          {["🇫🇷", "🇲🇦", "🇹🇷", "🇩🇪", "🇺🇸", "🇨🇦", "🇦🇪"].map(flag => (
            <span key={flag} className="text-2xl drop-shadow-sm">{flag}</span>
          ))}
        </div>
      </div>

      {/* Bottom section — white */}
      <div className="bg-background flex flex-col items-center px-6 pt-8 pb-10 flex-1">
        {/* 3 benefit icons */}
        <div className="flex items-start justify-center gap-5 w-full max-w-[340px] mb-8">
          {[
            { icon: "⏱️", label: "2 minutes\nchrono" },
            { icon: "🎯", label: "Pistes\npersonnalisées" },
            { icon: "✅", label: "100%\ngratuit" },
          ].map(b => (
            <div key={b.label} className="flex flex-col items-center gap-1.5 flex-1 text-center">
              <span className="text-2xl">{b.icon}</span>
              <span className="text-[0.78rem] font-semibold text-muted-foreground whitespace-pre-line leading-tight">{b.label}</span>
            </div>
          ))}
        </div>

        {/* CTA button */}
        <button
          onClick={onStart}
          data-testid="button-start"
          className="w-full max-w-[360px] bg-accent text-accent-foreground py-4 rounded-2xl font-extrabold text-[1.15rem] shadow-lg hover:bg-accent/90 active:scale-[0.97] transition-all flex items-center justify-center gap-2 relative overflow-hidden"
        >
          <span className="relative z-10">Commencer le test →</span>
        </button>

        {/* Social proof */}
        <div className="flex items-center gap-3 mt-5">
          {/* Avatar stack */}
          <div className="flex -space-x-2">
            {[
              { initials: "AM", bg: "bg-blue-500" },
              { initials: "IB", bg: "bg-emerald-500" },
              { initials: "FK", bg: "bg-violet-500" },
              { initials: "SD", bg: "bg-orange-500" },
            ].map(av => (
              <div key={av.initials} className={`w-8 h-8 rounded-full ${av.bg} flex items-center justify-center text-white text-[0.65rem] font-bold ring-2 ring-background`}>
                {av.initials}
              </div>
            ))}
          </div>
          <p className="text-[0.8rem] text-muted-foreground font-medium">
            <span className="text-foreground font-bold">+1 200</span> étudiants accompagnés
          </p>
        </div>
      </div>
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

/**
 * Normalize a WhatsApp number to E.164 format.
 * Strips spaces, dashes, and dots; keeps the leading +.
 * Examples:
 *   "+227 78 09 89 14" → "+22778098914"
 *   "+227-78-09-89-14" → "+22778098914"
 */
function normalizeWhatsApp(raw: string): string {
  return raw.replace(/[\s\-\.]/g, '');
}

/**
 * Validate a WhatsApp number.
 * Accepts any E.164 number: + followed by 7–15 digits, first digit non-zero.
 * Returns null if valid, or a French error message if invalid.
 */
function validateWhatsApp(raw: string): string | null {
  const cleaned = normalizeWhatsApp(raw);
  if (!/^\+[1-9][0-9]{6,14}$/.test(cleaned)) {
    return "Numéro invalide. Commence par l'indicatif pays (ex: +227 78 09 89 14 pour le Niger, +33 6 12 34 56 78 pour la France).";
  }
  return null;
}

function Contact({ answers, onSubmit, isSubmitting, submitError }: { 
  answers: QuizAnswers, 
  onSubmit: (val: { prenom: string, whatsapp: string, email: string }) => void,
  isSubmitting: boolean,
  submitError: string | null
}) {
  const [prenom, setPrenom] = useState(answers.prenom || "");
  const [email, setEmail] = useState(answers.email || "");

  // WhatsApp: indicatif + numéro local séparés
  const defaultCountry = COUNTRY_CODES[0]; // Niger par défaut
  const [country, setCountry] = useState<CountryEntry>(defaultCountry);
  const [localNumber, setLocalNumber] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [whatsappTouched, setWhatsappTouched] = useState(false);

  // Ferme le menu si on clique en dehors
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
    && email.trim().length > 3;

  const handleSubmit = () => {
    if (!isValid || isSubmitting) return;
    const normalized = normalizeWhatsApp(fullNumber);
    onSubmit({ prenom, whatsapp: normalized, email });
  };

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
            {/* Bouton indicatif */}
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

              {/* Menu déroulant */}
              {dropdownOpen && (
                <div className="absolute left-0 top-full mt-1 w-64 bg-background border-2 border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                  {/* Recherche */}
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
                  {/* Liste */}
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

            {/* Champ numéro local */}
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
          {!whatsappError && whatsappTouched && validateWhatsApp(fullNumber) === null && (
            <p className="mt-1.5 text-green-600 text-[0.82rem] font-medium flex items-center gap-1">
              <Check size={13} /> Numéro valide
            </p>
          )}
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
            🔒 On t'écrit uniquement pour t'aider dans ton projet d'études. Tu recevras le guide PDF offert.
          </p>
        </div>
      </div>
    </div>
  );
}

function Results({ answers, onRestart }: { answers: QuizAnswers, onRestart: () => void }) {
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');

  // Budget filter logic
  const budget = answers.budget_tranche || "unknown";
  const eligible = BUDGET_DESTINATIONS[budget] || [];
  let toShow: string[] = [];

  if (budget === "lt_2500") {
    // COLD — no destination cards at all
    toShow = [];
  } else if (budget === "unknown") {
    // A_QUALIFIER — show student's selections, or default
    const chosen = (answers.destinations || []).filter(d => d !== "Je ne sais pas");
    toShow = chosen.length > 0 ? chosen.slice(0, 4) : ["France", "Maroc", "Turquie"];
  } else {
    // For all other budgets: intersection of eligible & chosen, fallback to eligible
    const chosen = (answers.destinations || []).filter(d => d !== "Je ne sais pas");
    const intersection = chosen.filter(d => eligible.includes(d));
    toShow = (intersection.length > 0 ? intersection : eligible).slice(0, 4);
  }

  const getCountryInfo = (id: string) => {
    const opt = DESTINATIONS.find(d => d.id === id);
    if (!opt) return { flag: "🌍", name: id };
    const parts = opt.label.split(" ");
    return { flag: parts[0], name: parts.slice(1).join(" ") };
  };

  const domaineName = (answers.domaine || "ce domaine").replace(/^Autre: /, "");

  // Profile label
  const profileLabels: Record<string, string> = {
    HOT: "Profil CHAUD 🔥",
    WARM: "Profil SOLIDE 💪",
    STANDARD: "Profil STANDARD ✅",
    COLD: "Priorité bourses 🎓",
    A_QUALIFIER: "À explorer 🔍",
  };
  const profileLabel = profileLabels[answers.statut || ""] || "Profil détecté";

  // Country accent colors
  const countryColors: Record<string, string> = {
    France: "from-blue-700 to-blue-500",
    Maroc: "from-red-700 to-red-500",
    Turquie: "from-red-600 to-rose-400",
    Allemagne: "from-gray-700 to-gray-500",
    "Royaume-Uni": "from-blue-800 to-blue-600",
    USA: "from-blue-600 to-indigo-500",
    "Dubaï": "from-amber-600 to-yellow-500",
    Chine: "from-red-700 to-red-500",
    Canada: "from-red-600 to-red-400",
  };

  const handleShare = async () => {
    const shareData = {
      title: "Test d'orientation KPB Education",
      text: "Je viens de tester cet outil gratuit pour trouver des opportunités d'études à l'étranger 🎓 Teste-le toi aussi :",
      url: window.location.href,
    };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData).catch(console.error);
    } else {
      await navigator.clipboard.writeText(window.location.href).catch(console.error);
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 2500);
    }
  };

  const waShareUrl = `https://wa.me/?text=${encodeURIComponent("Je viens de tester cet outil gratuit pour trouver des opportunités d'études à l'étranger 🎓 Teste-le toi aussi : " + window.location.href)}`;

  return (
    <div className="flex-1 flex flex-col bg-background">

      {/* Profile header — gradient */}
      <div className="bg-gradient-to-br from-primary to-[hsl(221,83%,38%)] px-6 pt-8 pb-8 text-white">
        {answers.echeance === "Rentrée 2026" && (
          <div className="bg-white/20 rounded-xl px-4 py-2.5 mb-5 flex items-center gap-2 text-sm font-semibold">
            ⏰ Les délais pour la rentrée 2026 approchent — ne tarde pas !
          </div>
        )}
        <p className="text-white/70 text-sm font-semibold uppercase tracking-widest mb-1">{profileLabel}</p>
        <h1 className="text-[2rem] font-extrabold leading-tight mb-3">
          <span className="capitalize">{answers.prenom}</span>, voici tes pistes 🎯
        </h1>
        <div className="flex flex-wrap gap-2">
          {answers.niveau_etudes && (
            <span className="bg-white/15 rounded-full px-3 py-1 text-xs font-semibold">{answers.niveau_etudes}</span>
          )}
          {answers.domaine && (
            <span className="bg-white/15 rounded-full px-3 py-1 text-xs font-semibold">{domaineName}</span>
          )}
          {answers.echeance && (
            <span className="bg-white/15 rounded-full px-3 py-1 text-xs font-semibold">{answers.echeance}</span>
          )}
        </div>
      </div>

      <div className="p-5 pb-24 space-y-6">

        {/* Destination cards */}
        {toShow.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-[1rem] font-bold text-foreground">Destinations accessibles avec ton budget</h2>
            {toShow.map(dest => {
              const info = getCountryInfo(dest);
              let desc = DEST_TEXTS[dest] || `Excellentes opportunités en ${info.name}.`;
              desc = desc.replace("{domaine}", domaineName);
              const gradient = countryColors[dest] || "from-primary to-[hsl(221,83%,40%)]";

              return (
                <div key={dest} className="rounded-2xl overflow-hidden border border-border shadow-sm">
                  <div className={`bg-gradient-to-r ${gradient} px-4 py-3 flex items-center gap-3`}>
                    <span className="text-3xl">{info.flag}</span>
                    <div className="flex-1">
                      <h3 className="text-white font-extrabold text-[1.1rem]">{info.name}</h3>
                    </div>
                    <span className="bg-white/20 text-white text-[0.7rem] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                      ✓ Accessible
                    </span>
                  </div>
                  <div className="bg-white px-4 py-3">
                    <p className="text-muted-foreground text-[0.9rem] leading-relaxed">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA section */}
        <div className={`rounded-2xl p-5 space-y-4 ${answers.oriente_vers === 'webinaire' ? 'bg-amber-50 border border-amber-200' : 'bg-orange-50 border border-orange-200'}`}>
          {answers.oriente_vers === "webinaire" ? (
            <>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎓</span>
                <div>
                  <h3 className="font-extrabold text-foreground text-[1.05rem] mb-1">La bonne nouvelle : il existe des bourses</h3>
                  <p className="text-muted-foreground text-[0.92rem] leading-relaxed">
                    Des bourses peuvent couvrir une grande partie, voire la totalité, du coût de tes études à l'étranger. Découvre comment dans notre masterclass gratuite.
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
                href={`https://wa.me/33768674292?text=${encodeURIComponent("Bonjour KPB Education 👋 J'ai fait le test d'orientation et j'aimerais des informations sur les bourses et l'accompagnement.")}`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-contact-team"
                className="block text-center text-primary font-semibold text-[0.9rem] underline underline-offset-4"
              >
                Parler directement à un conseiller →
              </a>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📅</span>
                <div>
                  <h3 className="font-extrabold text-foreground text-[1.05rem] mb-1">Réserve ta consultation gratuite</h3>
                  <p className="text-muted-foreground text-[0.92rem] leading-relaxed">
                    Ton profil correspond aux programmes que KPB Education accompagne. Un conseiller peut étudier ton dossier avec toi et t'aider à monter ta candidature.
                  </p>
                </div>
              </div>
              <a
                href={`https://wa.me/33768674292?text=${encodeURIComponent(`Bonjour KPB Education 👋 Je viens de faire le test d'orientation et j'aimerais réserver ma consultation gratuite. Mon profil : ${answers.niveau_etudes}, destination ${(answers.destinations || []).join(", ")}, rentrée ${answers.echeance}, domaine ${answers.domaine}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="button-whatsapp-cta"
                className="w-full bg-accent text-accent-foreground py-4 rounded-xl font-bold text-[1.05rem] hover:bg-accent/90 transition-all active:scale-[0.98] shadow-sm flex items-center justify-center text-center gap-2"
              >
                📅 Réserver ma consultation gratuite
              </a>
            </>
          )}
        </div>

        {/* Share section — always expanded */}
        <div className="bg-muted rounded-2xl p-5 space-y-3">
          <div className="text-center">
            <h4 className="font-bold text-foreground text-[1rem] mb-1">Tes amis aussi peuvent trouver leur voie 🚀</h4>
            <p className="text-muted-foreground text-[0.85rem]">Partage cet outil gratuit avec tes amis qui veulent étudier à l'étranger.</p>
          </div>
          <button
            onClick={handleShare}
            data-testid="button-share"
            className="w-full bg-background border-2 border-border text-foreground py-3.5 rounded-xl font-bold text-[0.95rem] hover:bg-secondary/20 transition-colors flex items-center justify-center gap-2"
          >
            {shareState === 'copied' ? (
              <><Check size={18} className="text-green-600" /> Lien copié !</>
            ) : (
              <><Share2 size={18} /> Partager l'outil</>
            )}
          </button>
          <a
            href={waShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] text-white py-3.5 rounded-xl font-bold text-[0.95rem] hover:bg-[#22bf5b] transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-lg">💬</span> Partager sur WhatsApp
          </a>
        </div>

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
