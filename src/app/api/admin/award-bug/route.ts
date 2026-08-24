import { NextResponse } from "next/server";
import { grantBugReportAward } from "@/lib/bug-award";
import { verifyBugAwardToken } from "@/lib/bug-award-token";

function awardPage(title: string, body: string, status: number) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 32rem; margin: 3rem auto; padding: 0 1rem; color: #111; }
    a { color: #1E4FD8; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>${body}</p>
  <p><a href="/admin">Admin</a> · <a href="/board">Board</a></p>
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
    return awardPage(
      "Invalid link",
      "This award link is missing or expired. Open Admin and award from there.",
      403,
    );
  }

  const result = await grantBugReportAward(bugId);
  if (!result.ok) {
    return awardPage("Could not award", result.message, 400);
  }

  return awardPage("Credits awarded", result.message, 200);
}
