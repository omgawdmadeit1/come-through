import assert from "node:assert/strict";
import { test } from "node:test";
import { shouldKeepMissingRosterPeer } from "./p2p.ts";

test("keeps a connected pair when the signaling roster drops the peer", () => {
  assert.equal(shouldKeepMissingRosterPeer("connected", false), true);
});

test("keeps a pair whose data channel is still open after an ICE blip", () => {
  assert.equal(shouldKeepMissingRosterPeer("disconnected", true), true);
});

test("drops a pair that is not live once it leaves the roster", () => {
  assert.equal(shouldKeepMissingRosterPeer("connecting", false), false);
  assert.equal(shouldKeepMissingRosterPeer("failed", false), false);
  assert.equal(shouldKeepMissingRosterPeer("closed", false), false);
  assert.equal(shouldKeepMissingRosterPeer("new", false), false);
});
