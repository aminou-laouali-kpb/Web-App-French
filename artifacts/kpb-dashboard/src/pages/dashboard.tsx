import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useListLeads, useGetLeadsStats, Lead, getListLeadsQueryKey, getGetLeadsStatsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { format, formatDistanceToNow, differenceInMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import { LogOut, Download, Search, Users, Flame, Clock, RefreshCw, Loader2, AlertCircle, ArrowUpDown, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DESTINATIONS = ["Tous", "France", "Maroc", "Turquie", "Allemagne", "Royaume-Uni", "USA", "Dubaï", "Chine", "Canada"];
const STATUSES = ["Tous", "HOT", "WARM", "STANDARD", "COLD", "A_QUALIFIER"];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [destinationFilter, setDestinationFilter] = useState("Tous");
  const [sortBy, setSortBy] = useState<"created_at" | "updated_at">("created_at");

  // Protect route
  useEffect(() => {
    const token = sessionStorage.getItem("kpb_token");
    if (!token) {
      setLocation("/");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Query parameters
  const params = useMemo(() => {
    const p: Record<string, string> = {};
    if (debouncedSearch) p.search = debouncedSearch;
    if (statusFilter !== "Tous") p.statut = statusFilter;
    if (destinationFilter !== "Tous") p.destination = destinationFilter;
    p.sort = sortBy;
    return p;
  }, [debouncedSearch, statusFilter, destinationFilter, sortBy]);

  // Fetch data with 30-second polling for real-time updates
  const { 
    data: leads = [], 
    isLoading: leadsLoading, 
    error: leadsError,
    refetch: refetchLeads
  } = useListLeads(params, { 
    query: { 
      queryKey: getListLeadsQueryKey(params),
      retry: false,
      refetchInterval: 30_000,
      refetchIntervalInBackground: false,
    } 
  });

  const { 
    data: stats, 
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useGetLeadsStats({
    query: {
      queryKey: getGetLeadsStatsQueryKey(),
      retry: false,
      refetchInterval: 30_000,
      refetchIntervalInBackground: false,
    }
  });

  // Handle auth errors globally
  useEffect(() => {
    if (leadsError?.status === 401 || statsError?.status === 401) {
      sessionStorage.removeItem("kpb_token");
      setLocation("/");
      toast({
        variant: "destructive",
        title: "Session expirée",
        description: "Veuillez vous reconnecter.",
      });
    }
  }, [leadsError, statsError, setLocation, toast]);

  const handleLogout = () => {
    sessionStorage.removeItem("kpb_token");
    setLocation("/");
  };

  const exportCSV = () => {
    if (!leads.length) return;
    
    const headers = ["Date entrée", "Dernière activité", "Prénom", "WhatsApp", "Niveau", "Échéance", "Destinations", "Domaine", "Budget", "Statut", "Orienté vers"];
    const rows = leads.map(l => [
      l.created_at ? format(new Date(l.created_at), "dd/MM/yyyy HH:mm") : "",
      l.updated_at ? format(new Date(l.updated_at), "dd/MM/yyyy HH:mm") : "",
      l.prenom || "",
      l.whatsapp || "",
      l.niveau_etudes || "",
      l.echeance || "",
      l.destinations || "",
      l.domaine || "",
      l.budget_tranche || "",
      l.statut || "",
      l.oriente_vers || ""
    ].map(v => `"${v.replace(/"/g, '""')}"`).join(","));
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kpb_leads_${format(new Date(), "yyyyMMdd_HHmm")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadgeVariant = (status: string | null | undefined) => {
    switch (status?.toUpperCase()) {
      case "HOT": return "hot";
      case "WARM": return "warm";
      case "STANDARD": return "standard";
      case "COLD": return "cold";
      case "A_QUALIFIER": return "a_qualifier";
      default: return "outline";
    }
  };

  const getStatCount = (status: string) => {
    return stats?.by_status?.find(s => s.statut === status)?.count || 0;
  };

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center">
              <span className="font-bold text-primary text-xs">KPB</span>
            </div>
            <h1 className="font-bold text-xl text-primary tracking-tight">Tableau de bord Leads</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-4">
          <Card className="col-span-2 shadow-sm border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full text-primary">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                <h3 className="text-2xl font-bold">{stats?.total || 0}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-2 shadow-sm border-accent/20 bg-accent/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-accent/10 rounded-full text-accent">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">7 derniers jours</p>
                <h3 className="text-2xl font-bold">{stats?.recent_count || 0}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase">Hot</p>
              <h3 className="text-xl font-bold text-red-600">{getStatCount("HOT")}</h3>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase">Warm</p>
              <h3 className="text-xl font-bold text-orange-600">{getStatCount("WARM")}</h3>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase">Std</p>
              <h3 className="text-xl font-bold text-blue-600">{getStatCount("STANDARD")}</h3>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase">Cold</p>
              <h3 className="text-xl font-bold text-gray-600">{getStatCount("COLD")}</h3>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase">À Qualif.</p>
              <h3 className="text-xl font-bold text-purple-600">{getStatCount("A_QUALIFIER")}</h3>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <Card className="shadow-md">
          <CardHeader className="pb-4 border-b flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex flex-1 w-full gap-4 flex-col sm:flex-row">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher (prénom, WhatsApp)..."
                  className="pl-9 bg-gray-50/50"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-[140px] bg-gray-50/50"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s === "Tous" ? "Tous statuts" : s}</option>)}
                </Select>
                <Select 
                  value={destinationFilter} 
                  onChange={(e) => setDestinationFilter(e.target.value)}
                  className="w-[150px] bg-gray-50/50"
                >
                  {DESTINATIONS.map(d => <option key={d} value={d}>{d === "Tous" ? "Toutes dest." : d}</option>)}
                </Select>
                <Button
                  variant={sortBy === "updated_at" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy(prev => prev === "updated_at" ? "created_at" : "updated_at")}
                  title={sortBy === "updated_at" ? "Tri : dernière activité" : "Tri : date d'entrée"}
                >
                  <ArrowUpDown className="w-4 h-4 mr-1.5" />
                  {sortBy === "updated_at" ? "Activité récente" : "Date d'entrée"}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button variant="outline" size="sm" onClick={() => { refetchLeads(); refetchStats(); }}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
              <Button onClick={exportCSV} size="sm" variant="secondary">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {leadsLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                <p>Chargement des leads...</p>
              </div>
            ) : leadsError ? (
              <div className="flex flex-col items-center justify-center p-12 text-destructive">
                <AlertCircle className="w-8 h-8 mb-4" />
                <p>Erreur lors du chargement des données.</p>
              </div>
            ) : leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                <Users className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">Aucun lead trouvé</p>
                <p className="text-sm">Essayez de modifier vos filtres de recherche.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-gray-50/80">
                  <TableRow>
                    <TableHead className="w-[110px]">Entrée</TableHead>
                    <TableHead className="w-[130px]">Dernière activité</TableHead>
                    <TableHead>Prénom</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead className="hidden md:table-cell">Niveau</TableHead>
                    <TableHead className="hidden lg:table-cell">Destinations</TableHead>
                    <TableHead className="hidden xl:table-cell">Domaine</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Orienté vers</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => {
                    const isReturned = lead.updated_at && lead.created_at &&
                      differenceInMinutes(new Date(lead.updated_at), new Date(lead.created_at)) > 5;
                    return (
                    <TableRow key={lead.id} className="hover:bg-blue-50/30">
                      <TableCell className="font-medium text-xs text-muted-foreground whitespace-nowrap">
                        {lead.created_at ? format(new Date(lead.created_at), "dd MMM yyyy", { locale: fr }) : "-"}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {lead.updated_at ? (
                          <span className={`inline-flex items-center gap-1 ${isReturned ? "text-emerald-700 font-semibold" : "text-muted-foreground"}`}
                            title={format(new Date(lead.updated_at), "dd/MM/yyyy HH:mm")}>
                            {isReturned && <RotateCcw className="w-3 h-3 flex-shrink-0" />}
                            {formatDistanceToNow(new Date(lead.updated_at), { locale: fr, addSuffix: true })}
                          </span>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="font-semibold">{lead.prenom || "-"}</TableCell>
                      <TableCell className="text-sm">{lead.whatsapp || "-"}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{lead.niveau_etudes || "-"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm max-w-[150px] truncate" title={lead.destinations || ""}>
                        {lead.destinations || "-"}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-sm max-w-[150px] truncate" title={lead.domaine || ""}>
                        {lead.domaine || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(lead.statut) as any}>
                          {lead.statut?.replace("_", " ") || "INCONNU"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                          {lead.oriente_vers || "-"}
                        </span>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
