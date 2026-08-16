import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkBotGuard } from "@/lib/bot-guard";

export async function requestIp() {
  const h = await headers();
  return (
    h.get("cf-connecting-ip") ??
    h.get("x-forwarded-for") ??
    h.get("x-real-ip")
  );
}

export async function assertHuman(
  formData: FormData,
  failPath: string,
  extra: Record<string, string> = {},
) {
  const result = await checkBotGuard(formData, await requestIp());
  if (result.ok) return;
  const query = new URLSearchParams({ ...extra, error: result.error });
  redirect(`${failPath}?${query.toString()}`);
}
