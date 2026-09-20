import assert from "node:assert/strict";
import { test } from "node:test";
import { sendOnOpenReliable } from "./p2p.ts";

test("sendOnOpenReliable sends only on open reliable channels and counts them", () => {
  const sent: string[] = [];
  const open = {
    reliable: {
      readyState: "open",
      send: (wire: string) => {
        sent.push(wire);
      },
    },
  };
  const connecting = {
    reliable: {
      readyState: "connecting",
      send: () => {
        throw new Error("must not send on a connecting channel");
      },
    },
  };

  const count = sendOnOpenReliable([open, undefined, connecting], '{"t":"d"}');
  assert.equal(count, 1);
  assert.deepEqual(sent, ['{"t":"d"}']);
});

test("sendOnOpenReliable reports zero when ICE-connected peers have no open channel", () => {
  const count = sendOnOpenReliable(
    [{ reliable: { readyState: "connecting", send: () => {} } }],
    "x",
  );
  assert.equal(count, 0);
});
