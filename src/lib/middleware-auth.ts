export type SessionRedirect = {
  pathname: "/login" | "/board";
  next?: string;
};

export function isLoginPath(path: string): boolean {
  return path.startsWith("/login");
}

export function isSignupPath(path: string): boolean {
  return path.startsWith("/signup");
}

/**
 * Redirect after a session lookup when launch is open.
 * Null means the request should continue.
 *
 * /login and /signup are looked up so a signed-in visitor still goes to
 * /board. A signed-out visitor stays on those pages: sending /login to
 * /login?next=/login is a 307 loop.
 */
export function launchSessionRedirect(
  path: string,
  hasUser: boolean,
): SessionRedirect | null {
  if (!hasUser) {
    if (isLoginPath(path) || isSignupPath(path)) return null;
    return { pathname: "/login", next: path };
  }

  if (path === "/login" || path === "/signup") {
    return { pathname: "/board" };
  }

  return null;
}

/** Never send a request that is already for /login back to /login. */
export function guardLoginRedirect(
  path: string,
  redirect: SessionRedirect | null,
): SessionRedirect | null {
  if (redirect?.pathname === "/login" && isLoginPath(path)) return null;
  return redirect;
}
