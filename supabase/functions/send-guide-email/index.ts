import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY  = Deno.env.get("RESEND_API_KEY")  ?? "";
const TRIGGER_SECRET  = Deno.env.get("TRIGGER_SECRET")  ?? "";
const GUIDE_PDF_URL   = Deno.env.get("GUIDE_PDF_URL")   ?? "";
const FROM_EMAIL      = Deno.env.get("FROM_EMAIL")      ?? "KPB Education <noreply@kpbeducation.com>";

/** Escape user-supplied strings before embedding in HTML. */
function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  // ── Auth: require shared trigger secret ──────────────────────────────────
  if (!TRIGGER_SECRET) {
    console.error("[send-guide-email] TRIGGER_SECRET not configured");
    return json({ error: "server misconfigured" }, 500);
  }
  const incomingSecret = req.headers.get("X-Trigger-Secret") ?? "";
  if (incomingSecret !== TRIGGER_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  // ── Parse payload ─────────────────────────────────────────────────────────
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid JSON" }, 400);
  }

  const record = (payload.record ?? payload) as Record<string, string>;
  const email  = record?.email ?? "";

  if (!email || !email.includes("@")) {
    return json({ skipped: "no valid email" });
  }

  if (!RESEND_API_KEY) {
    console.error("[send-guide-email] RESEND_API_KEY not configured — skipping");
    return json({ error: "email service not configured" });
  }

  // ── Build email content (all user data HTML-escaped) ─────────────────────
  const prenom       = esc(record.prenom       ?? "étudiant(e)");
  const destinations = esc(record.destinations ?? "");
  const domaine      = esc(record.domaine      ?? "");
  const echeance     = esc(record.echeance     ?? "");

  const guideBtn = GUIDE_PDF_URL
    ? `<p style="margin:20px 0;">
         <a href="${esc(GUIDE_PDF_URL)}"
            style="display:inline-block;background:#f97316;color:#fff;padding:13px 28px;
                   border-radius:10px;text-decoration:none;font-weight:800;font-size:15px;">
           📥 Télécharger le Guide 5 Destinations 2026
         </a>
       </p>`
    : `<p style="margin:16px 0;color:#64748b;font-size:14px;">
         Le guide sera disponible très bientôt — notre équipe te le fera parvenir dès que possible.
       </p>`;

  const profileRows = [
    destinations && `🌍 <strong>Destinations :</strong> ${destinations}`,
    domaine      && `🎓 <strong>Domaine :</strong> ${domaine}`,
    echeance     && `📅 <strong>Rentrée visée :</strong> ${echeance}`,
  ]
    .filter(Boolean)
    .map(row => `<p style="margin:6px 0;color:#475569;font-size:14px;">${row}</p>`)
    .join("");

  const profileBlock = profileRows
    ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;
                   padding:16px 20px;margin:20px 0;">${profileRows}</div>`
    : "";

  const waText = encodeURIComponent(
    "Bonjour KPB Education 👋 J'ai reçu le guide et j'aimerais en savoir plus sur l'accompagnement."
  );
  const waUrl = `https://wa.me/33768674292?text=${waText}`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Ton Guide KPB Education</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 12px;">
<tr><td align="center">
<table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;
                            box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#1a3a6b 0%,#2563a8 100%);padding:32px 32px 28px;">
    <p style="margin:0 0 6px;color:rgba(255,255,255,0.65);font-size:12px;font-weight:700;
              letter-spacing:1.5px;text-transform:uppercase;">KPB Education</p>
    <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;line-height:1.2;">
      Bonjour ${prenom} 👋
    </h1>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:28px 32px;">
    <p style="margin:0 0 16px;color:#1e293b;font-size:16px;line-height:1.65;">
      Merci d'avoir fait le test d'orientation KPB Education !<br>
      Voici ton <strong>Guide 5 Destinations 2026</strong>, conçu pour les étudiants
      africains qui veulent étudier à l'étranger.
    </p>

    ${guideBtn}
    ${profileBlock}

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">

    <p style="margin:0 0 8px;color:#1e293b;font-size:15px;font-weight:700;">Tu veux aller plus loin ?</p>
    <p style="margin:0 0 18px;color:#64748b;font-size:14px;line-height:1.6;">
      Notre équipe peut t'aider à monter ton dossier, choisir les meilleures universités
      et maximiser tes chances d'admission.
    </p>
    <p style="margin:0;">
      <a href="${waUrl}"
         style="display:inline-block;background:#1a3a6b;color:#fff;padding:13px 24px;
                border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">
        💬 Parler à un conseiller KPB
      </a>
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f8fafc;padding:18px 32px;border-top:1px solid #e2e8f0;">
    <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
      KPB Education — Accompagnement études à l'étranger<br>
      Tu reçois cet email car tu as complété notre test d'orientation gratuit.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  // ── Send via Resend ───────────────────────────────────────────────────────
  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:    FROM_EMAIL,
      to:      [email],
      subject: `🎓 ${prenom}, ton Guide 5 Destinations 2026 est là !`,
      html,
    }),
  });

  const data = await resendRes.json();

  if (!resendRes.ok) {
    console.error("[send-guide-email] Resend error:", JSON.stringify(data));
    return json({ error: data });
  }

  console.log("[send-guide-email] Sent OK — id:", data.id, "to:", email);
  return json({ sent: true, id: data.id });
});
