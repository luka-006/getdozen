/**
 * Updates the hosted Magic Link template so waitlist emails include {{ .Token }}.
 * Requires SUPABASE_ACCESS_TOKEN from https://supabase.com/dashboard/account/tokens
 */
const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF || "blvoisjgveskbkzzjhcg";

if (!token) {
  console.error("Set SUPABASE_ACCESS_TOKEN first.");
  process.exit(1);
}

const body = {
  mailer_subjects_magic_link: "Your Dozen code is {{ .Token }}",
  mailer_templates_magic_link_content: `<h2>Your Dozen code</h2>
<p style="font-size:28px;letter-spacing:8px;font-family:ui-monospace,monospace;font-weight:700">{{ .Token }}</p>
<p>Enter this code on getdozen.dev. It expires in one hour.</p>
<p><a href="{{ .SiteURL }}/auth/confirm">Enter code</a></p>`,
};

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

if (!res.ok) {
  console.error(await res.text());
  process.exit(1);
}

console.log("Magic Link template updated.");
