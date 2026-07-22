import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { verifySessionToken } from "./auth";

const router: IRouter = Router();

let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin;
  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase URL or service role key not configured");
  }
  _supabaseAdmin = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
  return _supabaseAdmin;
}

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers["authorization"];
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = auth.slice(7);
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    res.status(500).json({ error: "Server configuration error" });
    return;
  }
  if (!verifySessionToken(token, sessionSecret)) {
    res.status(401).json({ error: "Invalid or expired session token" });
    return;
  }
  next();
}

router.get("/leads", requireAuth, async (req, res): Promise<void> => {
  try {
    const supabase = getSupabaseAdmin();
    const { statut, destination, search, sort } = req.query as Record<string, string>;

    const sortColumn = sort === "updated_at" ? "updated_at" : "created_at";
    let query = supabase
      .from("leads")
      .select("*")
      .order(sortColumn, { ascending: false });

    if (statut) {
      query = query.eq("statut", statut);
    }
    if (destination) {
      query = query.ilike("destinations", `%${destination}%`);
    }
    if (search) {
      query = query.or(
        `prenom.ilike.%${search}%,whatsapp.ilike.%${search}%,domaine.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      req.log.error({ error }, "Supabase error fetching leads");
      res.status(500).json({ error: error.message });
      return;
    }

    res.json(data ?? []);
  } catch (err) {
    req.log.error({ err }, "Error fetching leads");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/leads/stats", requireAuth, async (req, res): Promise<void> => {
  try {
    const supabase = getSupabaseAdmin();

    const { data: leadsRaw, error } = await supabase
      .from("leads")
      .select("statut, destinations, created_at");

    if (error) {
      req.log.error({ error }, "Supabase error fetching leads stats");
      res.status(500).json({ error: error.message });
      return;
    }

    type LeadRow = { statut: string | null; destinations: string | null; created_at: string | null };
    const allLeads: LeadRow[] = (leadsRaw ?? []) as LeadRow[];
    const total = allLeads.length;

    // Count by status
    const statusMap: Record<string, number> = {};
    for (const lead of allLeads) {
      const s = lead.statut ?? "A_QUALIFIER";
      statusMap[s] = (statusMap[s] ?? 0) + 1;
    }
    const by_status = Object.entries(statusMap).map(([statut, count]) => ({ statut, count }));

    // Count by destination
    const destMap: Record<string, number> = {};
    for (const lead of allLeads) {
      if (lead.destinations) {
        const dests = lead.destinations.split(",").map((d: string) => d.trim()).filter(Boolean);
        for (const dest of dests) {
          destMap[dest] = (destMap[dest] ?? 0) + 1;
        }
      }
    }
    const by_destination = Object.entries(destMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([statut, count]) => ({ statut, count }));

    // Recent: last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recent_count = allLeads.filter((l) => {
      if (!l.created_at) return false;
      return new Date(l.created_at) >= sevenDaysAgo;
    }).length;

    res.json({ total, by_status, by_destination, recent_count });
  } catch (err) {
    req.log.error({ err }, "Error fetching leads stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/leads/:id", requireAuth, async (req, res): Promise<void> => {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = req.params;

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        res.status(404).json({ error: "Lead not found" });
        return;
      }
      req.log.error({ error }, "Supabase error fetching lead");
      res.status(500).json({ error: error.message });
      return;
    }

    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Error fetching lead");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
