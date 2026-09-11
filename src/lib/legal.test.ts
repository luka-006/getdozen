import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatOperatorOwnershipLine,
  hasFullLegalIdentity,
  operatorOwnershipLine,
} from "./legal";

describe("formatOperatorOwnershipLine", () => {
  it("formats obrt operator in one line without VAT", () => {
    const line = formatOperatorOwnershipLine({
      brand: "Dozen",
      siteUrl: "https://getdozen.dev",
      operatorName: "Kasalo Digital",
      businessForm: "paušalni obrt",
      address: "Tvrtkova 1, Knin, Croatia",
      country: "Republic of Croatia",
      oib: "05372595966",
      email: "hello@getdozen.dev",
    });
    assert.match(line, /brand “Dozen” and https:\/\/getdozen\.dev/);
    assert.match(line, /Kasalo Digital \(paušalni obrt\)/);
    assert.match(line, /OIB 05372595966/);
    assert.match(line, /hello@getdozen\.dev/);
    assert.doesNotMatch(line, /PDV/);
  });

  it("exposes full operator identity from published defaults", () => {
    assert.equal(hasFullLegalIdentity(), true);
    const line = operatorOwnershipLine();
    assert.ok(line);
    assert.match(line!, /OIB 05372595966/);
    assert.doesNotMatch(line!, /Operator identity is published/);
  });
});
