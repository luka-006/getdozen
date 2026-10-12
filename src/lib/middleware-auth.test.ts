import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  guardLoginRedirect,
  launchSessionRedirect,
  type SessionRedirect,
} from "./middleware-auth";

function follow(path: string, hasUser: boolean): string {
  let current = path;
  for (let hop = 0; hop < 5; hop++) {
    const redirect = guardLoginRedirect(
      current,
      launchSessionRedirect(current, hasUser),
    );
    if (!redirect) return current;
    current = redirect.pathname;
  }
  throw new Error(`redirect loop from ${path}`);
}

describe("launch session redirects", () => {
  it("lets signed-out users stay on /login and /signup", () => {
    assert.equal(launchSessionRedirect("/login", false), null);
    assert.equal(launchSessionRedirect("/signup", false), null);
    assert.equal(launchSessionRedirect("/login/forgot", false), null);
    assert.equal(
      guardLoginRedirect("/login", launchSessionRedirect("/login", false)),
      null,
    );
    assert.equal(
      guardLoginRedirect("/signup", launchSessionRedirect("/signup", false)),
      null,
    );
  });

  it("never redirects a /login request to /login", () => {
    const forced: SessionRedirect = { pathname: "/login", next: "/login" };
    assert.equal(guardLoginRedirect("/login", forced), null);
    assert.equal(guardLoginRedirect("/login/forgot", forced), null);
    assert.deepEqual(guardLoginRedirect("/board", forced), forced);
  });

  it("sends signed-in users from /login and /signup to /board", () => {
    assert.deepEqual(launchSessionRedirect("/login", true), {
      pathname: "/board",
    });
    assert.deepEqual(launchSessionRedirect("/signup", true), {
      pathname: "/board",
    });
  });

  it("sends signed-out users on protected pages to /login?next=", () => {
    assert.deepEqual(launchSessionRedirect("/board", false), {
      pathname: "/login",
      next: "/board",
    });
    assert.deepEqual(launchSessionRedirect("/requests/new", false), {
      pathname: "/login",
      next: "/requests/new",
    });
  });

  it("lets signed-in users through on protected pages", () => {
    assert.equal(launchSessionRedirect("/board", true), null);
    assert.equal(launchSessionRedirect("/requests/new", true), null);
  });

  it("settles signed-out auth and protected paths without looping", () => {
    assert.equal(follow("/login", false), "/login");
    assert.equal(follow("/signup", false), "/signup");
    assert.equal(follow("/board", false), "/login");
    assert.equal(follow("/requests/new", false), "/login");
  });

  it("settles signed-in auth paths on /board", () => {
    assert.equal(follow("/login", true), "/board");
    assert.equal(follow("/signup", true), "/board");
    assert.equal(follow("/board", true), "/board");
    assert.equal(follow("/requests/new", true), "/requests/new");
  });
});
