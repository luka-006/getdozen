import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeEmailIdentity, sameEmailIdentity } from "./email-identity";

describe("normalizeEmailIdentity", () => {
  it("trims, lowercases, and strips plus-tags on every domain", () => {
    assert.equal(normalizeEmailIdentity("  Foo+News@X.com "), "foo@x.com");
    assert.equal(normalizeEmailIdentity("a+b+c@yahoo.com"), "a@yahoo.com");
  });

  it("drops dots only for gmail and googlemail", () => {
    assert.equal(normalizeEmailIdentity("f.o.o@gmail.com"), "foo@gmail.com");
    assert.equal(normalizeEmailIdentity("f.o.o@googlemail.com"), "foo@gmail.com");
    assert.equal(normalizeEmailIdentity("f.o.o@yahoo.com"), "f.o.o@yahoo.com");
  });

  it("does not treat different domains as the same person", () => {
    assert.equal(sameEmailIdentity("foo@gmail.com", "foo@yahoo.com"), false);
    assert.equal(sameEmailIdentity("f.o.o@yahoo.com", "foo@yahoo.com"), false);
  });

  it("matches case, plus-tag, and gmail-dot variants", () => {
    assert.equal(sameEmailIdentity("Foo@X.com", "foo@x.com"), true);
    assert.equal(sameEmailIdentity("foo+tag@gmail.com", "foo@gmail.com"), true);
    assert.equal(sameEmailIdentity("f.oo@googlemail.com", "foo@gmail.com"), true);
  });
});
