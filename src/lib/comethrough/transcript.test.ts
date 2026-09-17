import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { combineHoldTranscript } from "./transcript.ts";

describe("combineHoldTranscript", () => {
  it("keeps still-interim speech when finals are empty", () => {
    // iOS Safari often never marks a short utterance isFinal before release.
    assert.equal(combineHoldTranscript("", "come through the door"), "come through the door");
  });

  it("joins finalized prefixes with the latest interim tail", () => {
    assert.equal(combineHoldTranscript("come through", "the kitchen"), "come through the kitchen");
  });

  it("does not invent words from a stale empty interim", () => {
    assert.equal(combineHoldTranscript("", ""), "");
    assert.equal(combineHoldTranscript("hello", ""), "hello");
  });
});
