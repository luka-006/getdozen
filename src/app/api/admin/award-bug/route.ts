import { NextResponse } from "next/server";
import { grantBugReportAward } from "@/lib/bug-award";
import { verifyBugAwardToken } from "@/lib/bug-award-token";

function awardPopup(message: string, status: number, success: boolean) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${message}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      font-family: system-ui, -apple-system, sans-serif;
      background: rgba(17, 17, 17, 0.35);
      color: #111;
    }
    .popup {
      width: min(100%, 18rem);
      padding: 1.5rem 1.25rem;
      border-radius: 12px;
      background: #fff;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
      text-align: center;
    }
    .icon {
      width: 2.5rem;
      height: 2.5rem;
      margin: 0 auto 0.75rem;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 700;
      line-height: 1;
    }
    .icon.ok { background: #e8f5e9; color: #2e7d32; }
    .icon.err { background: #fdecea; color: #c62828; }
    h1 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      line-height: 1.35;
    }
  </style>
</head>
<body>
  <div class="popup" role="status" aria-live="polite">
    <div class="icon ${success ? "ok" : "err"}">${success ? "✓" : "!"}</div>
    <h1>${message}</h1>
  </div>
</body>
</html>`;
  return new NextResponse(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const bugId = url.searchParams.get("bug")?.trim() ?? "";
  const sig = url.searchParams.get("sig")?.trim() ?? "";

  if (!bugId || !sig || !verifyBugAwardToken(bugId, sig)) {
    return awardPopup("Invalid or expired link", 403, false);
  }

  const result = await grantBugReportAward(bugId);
  if (!result.ok) {
    return awardPopup(result.message, 400, false);
  }

  const message =
    result.message === "Already awarded" ? "Already awarded" : "Successfully awarded";
  return awardPopup(message, 200, true);
}
