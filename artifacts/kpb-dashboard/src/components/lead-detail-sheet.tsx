import { useGetLead, Lead } from "@workspace/api-client-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Copy, Check, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface LeadDetailSheetProps {
  leadId: string | null;
  onClose: () => void;
}

const getStatusBadgeVariant = (status: string | null | undefined) => {
  switch (status?.toUpperCase()) {
    case "PRET": return "pret";
    case "BOURSE": return "bourse";
    case "EPARGNE": return "epargne";
    case "HOT": return "hot";
    case "WARM": return "warm";
    case "STANDARD": return "standard";
    case "COLD": return "cold";
    case "A_QUALIFIER": return "a_qualifier";
    default: return "outline";
  }
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value || value === "-") return null;
  return (
    <div className="flex flex-col gap-0.5 py-2">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

export function LeadDetailSheet({ leadId, onClose }: LeadDetailSheetProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: lead, isLoading, error } = useGetLead(leadId ?? "", {
    query: { enabled: !!leadId },
  });

  const handleCopyWhatsApp = () => {
    if (!lead?.whatsapp) return;
    navigator.clipboard.writeText(lead.whatsapp).then(() => {
      setCopied(true);
      toast({ title: "Copié !", description: `${lead.whatsapp} copié dans le presse-papiers.` });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Sheet open={!!leadId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Chargement du profil...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-destructive">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm">Impossible de charger ce lead.</p>
          </div>
        ) : lead ? (
          <>
            <SheetHeader className="pr-6 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary">
                    {lead.prenom ? lead.prenom.charAt(0).toUpperCase() : "?"}
                  </span>
                </div>
                <div>
                  <SheetTitle className="text-xl">{lead.prenom || "Inconnu"}</SheetTitle>
                  <SheetDescription className="text-sm font-mono">
                    {lead.whatsapp || "Pas de numéro"}
                  </SheetDescription>
                </div>
              </div>

              {/* Status badge */}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={getStatusBadgeVariant(lead.statut) as any} className="text-sm px-3 py-1">
                  {lead.statut?.replace("_", " ") || "INCONNU"}
                </Badge>
                {lead.oriente_vers && (
                  <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                    {lead.oriente_vers}
                  </span>
                )}
              </div>
            </SheetHeader>

            <Separator />

            <div className="divide-y mt-2">
              <DetailRow label="Niveau d'études" value={lead.niveau_etudes} />
              <DetailRow label="Échéance" value={lead.echeance} />
              <DetailRow label="Destinations" value={lead.destinations} />
              <DetailRow label="Domaine d'études" value={lead.domaine} />
              <DetailRow label="Capital an 1" value={lead.budget_tranche} />
              <DetailRow
                label="Date d'entrée"
                value={
                  lead.created_at
                    ? `${format(new Date(lead.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}`
                    : undefined
                }
              />
              {lead.updated_at && lead.updated_at !== lead.created_at && (
                <DetailRow
                  label="Dernière activité"
                  value={formatDistanceToNow(new Date(lead.updated_at), { locale: fr, addSuffix: true })}
                />
              )}
            </div>

            <Separator className="mt-4" />

            {/* WhatsApp CTA */}
            <div className="mt-6">
              <Button
                className="w-full gap-2"
                onClick={handleCopyWhatsApp}
                disabled={!lead.whatsapp}
                variant={copied ? "outline" : "default"}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    Numéro copié !
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copier le WhatsApp
                  </>
                )}
              </Button>
              {lead.whatsapp && (
                <p className="text-center text-xs text-muted-foreground mt-2 font-mono">{lead.whatsapp}</p>
              )}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
