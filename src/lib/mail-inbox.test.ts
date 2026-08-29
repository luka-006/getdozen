import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ownerInbox } from "./mail-inbox";

describe("ownerInbox", () => {
  it("prefers MAIL_FORWARD_TO then SUPPORT_TO", () => {
    const prevForward = process.env.MAIL_FORWARD_TO;
    const prevSupport = process.env.SUPPORT_TO;
    const prevAdmin = process.env.ADMIN_OWNER_EMAIL;

    process.env.MAIL_FORWARD_TO = "forward@example.com";
    process.env.SUPPORT_TO = "support@example.com";
    process.env.ADMIN_OWNER_EMAIL = "admin@example.com";
    assert.equal(ownerInbox(), "forward@example.com");

    delete process.env.MAIL_FORWARD_TO;
    assert.equal(ownerInbox(), "support@example.com");

    delete process.env.SUPPORT_TO;
    assert.equal(ownerInbox(), "admin@example.com");

    delete process.env.ADMIN_OWNER_EMAIL;
    assert.equal(ownerInbox(), "luka.kasalo.web@gmail.com");

    if (prevForward) process.env.MAIL_FORWARD_TO = prevForward;
    else delete process.env.MAIL_FORWARD_TO;
    if (prevSupport) process.env.SUPPORT_TO = prevSupport;
    else delete process.env.SUPPORT_TO;
    if (prevAdmin) process.env.ADMIN_OWNER_EMAIL = prevAdmin;
    else delete process.env.ADMIN_OWNER_EMAIL;
  });
});
