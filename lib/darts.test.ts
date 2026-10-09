import assert from "node:assert/strict";
import { test } from "node:test";
import { adviceText, finishes, label, MISS, shift, start, throwDart, value, type Dart, type Match } from "./darts.ts";

const D = (m: 1 | 2 | 3, n: number): Dart => ({ m, n });
const cfg = (over = {}) => ({ names: ["Al", "Bo"], start: 301, doubleOut: true, legs: 1, ...over });
const ok = (m: Match): Match => ({ ...m, steps: [] });
const throws = (m: Match, ...ds: Dart[]) => ds.reduce((x, d) => throwDart(ok(x), d), m);

test("checkout routes are valid and sensible", () => {
  assert.equal(finishes(170, 3, true)[0].map(label).join(" "), "T20 T20 Bull");
  assert.deepEqual(finishes(40, 3, true)[0].map(label), ["D20"]);
  assert.deepEqual(finishes(32, 3, true)[0].map(label), ["D16"]);
  assert.deepEqual(finishes(100, 2, true)[0].map(label), ["T20", "D20"]);
  for (let r = 2; r <= 170; r++) for (const route of finishes(r, 3, true)) {
    assert.equal(route.reduce((s, d) => s + value(d), 0), r);
    assert.equal(route.at(-1)!.m, 2);
  }
  for (const bogey of [169, 168, 166, 165, 163, 162, 159]) assert.equal(finishes(bogey, 3, true).length, 0);
  assert.equal(finishes(171, 3, true).length, 0);
  assert.equal(finishes(180, 3, false)[0].map(label).join(" "), "T20 T20 T20"); // straight out
});

test("advice: finish, setup, score", () => {
  assert.match(adviceText(60, 3, true), /^Checkout: S20 · D20$/);
  assert.equal(adviceText(169, 3, true), "Score big: aim for T20"); // bogey number, no 1-dart setup
  assert.equal(adviceText(501, 3, true), "Score big: aim for T20");
  assert.match(adviceText(41, 1, true), /^No finish yet. Set up: /); // one dart left: leave a double
  assert.match(adviceText(52, 1, true), /Set up: /);
});

test("visit: 3 darts hand over with a prompt, score tracked", () => {
  let m = start(cfg());
  assert.equal(m.steps.length, 1);
  assert.equal(throwDart(m, D(3, 20)), m); // blocked by intro prompt
  m = throws(ok(m), D(3, 20), D(3, 20), D(3, 20));
  assert.equal(m.rem[0], 121);
  assert.equal(m.cur, 1);
  assert.equal(m.steps[0].title, "Al scored 180!");
  assert.match(m.steps[0].lines.join(" "), /Next up: Bo \(301 left\)/);
});

test("bust: below zero, leaving 1, and non-double finish revert the score", () => {
  let m = ok(start(cfg({ start: 40 })));
  m = throws(m, D(3, 20)); // 40-60 < 0
  assert.equal(m.steps[0].title, "BUST!");
  assert.equal(m.rem[0], 40);
  assert.equal(m.cur, 1);
  m = throws(m, D(3, 13)); // Bo: 40-39=1 -> bust leaving 1
  assert.match(m.steps[0].lines[0], /leave 1/);
  assert.equal(m.rem[1], 40);
  m = throws(m, D(1, 20), D(1, 20)); // Al: 40 -> 20 -> 0 with a single = bust
  assert.match(m.steps[0].lines[0], /double/);
  assert.equal(m.rem[0], 40);
  // straight out: same single finish is fine
  const s = throws(ok(start(cfg({ start: 40, doubleOut: false }))), D(1, 20), D(1, 20));
  assert.equal(s.winner, 0);
});

test("leg and match: checkout, alternate starter, averages", () => {
  let m = ok(start(cfg({ start: 40, legs: 2 })));
  m = throws(m, MISS, MISS, MISS, D(1, 1), D(1, 1), D(1, 1)); // Al miss x3, Bo 3 singles -> 37
  m = throws(m, D(2, 20)); // Al wins leg 1
  assert.equal(m.legs[0], 1);
  assert.equal(m.winner, null);
  assert.deepEqual(m.steps.map((s) => s.icon), ["🎯", "🔁"]);
  assert.deepEqual(m.rem, [40, 40]);
  assert.equal(m.cur, 1); // Bo starts leg 2
  m = shift(shift(m));
  m = throws(m, D(2, 20)); // Bo wins leg 2 (1-1)
  assert.equal(m.legs[1], 1);
  m = throws(ok({ ...m, steps: [] }), MISS, MISS, MISS); // Al (starter leg 3? Al) misses
  m = throws(m, D(2, 20));
  assert.equal(m.winner, 1);
  assert.match(m.steps.at(-1)!.lines.join(" "), /3-dart avg/);
});
