import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { BrowserContext } from "playwright";
import { previewBaseUrl } from "./script-env";

type CookieRow = {
  name: string;
  value: string;
  options?: {
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "Lax" | "Strict" | "None";
  };
};

function sameSite(v?: string): "Lax" | "Strict" | "None" {
  const s = (v ?? "Lax").toLowerCase();
  if (s === "strict") return "Strict";
  if (s === "none") return "None";
  return "Lax";
}

/** Magic-link login for Playwright capture scripts (uses service role). */
export async function loginPreviewContext(context: BrowserContext) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const email =
    process.env.PREVIEW_LOGIN_EMAIL?.trim() ?? "lukakasalo96@gmail.com";
  if (!url || !serviceKey || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
    );
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const tokenHash = data.properties?.hashed_token;
  if (error || !tokenHash) {
    throw new Error(error?.message ?? "Could not generate magic link");
  }

  const userClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: verify, error: verifyErr } = await userClient.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  if (verifyErr || !verify.session) {
    throw new Error(verifyErr?.message ?? "Magic link verify failed");
  }

  const pending: CookieRow[] = [];
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return pending.map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        for (const c of cookiesToSet) {
          const idx = pending.findIndex((p) => p.name === c.name);
          if (idx >= 0) pending[idx] = c;
          else pending.push(c);
        }
      },
    },
  });
  await supabase.auth.setSession({
    access_token: verify.session.access_token,
    refresh_token: verify.session.refresh_token,
  });

  const host = new URL(previewBaseUrl()).hostname;
  await context.addCookies(
    pending.map(({ name, value, options }) => ({
      name,
      value,
      domain: options?.domain ?? host,
      path: options?.path ?? "/",
      expires: options?.expires,
      httpOnly: options?.httpOnly,
      secure: options?.secure ?? previewBaseUrl().startsWith("https"),
      sameSite: sameSite(options?.sameSite),
    })),
  );
  console.log(`Logged in as ${email}`);
}
