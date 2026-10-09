import { expect, test, type Page } from "@playwright/test";

const dialog = (page: Page) => page.getByRole("dialog");
const confirm = (page: Page) => dialog(page).getByRole("button").last().click();
const drainAll = async (page: Page) => { while (await dialog(page).isVisible()) await confirm(page); };

async function startMatch(page: Page, o: { start?: number; legs?: number; bull?: string; names?: [string, string] } = {}) {
  await page.goto("./");
  if (o.names) {
    await page.getByLabel("Player 1 name").fill(o.names[0]);
    await page.getByLabel("Player 2 name").fill(o.names[1]);
  }
  await page.getByRole("button", { name: /Next: options/ }).click();
  await page.getByRole("button", { name: String(o.start ?? 301), exact: true }).click();
  if (o.legs) await page.getByRole("button", { name: new RegExp(`^${o.legs} legs?$`) }).click();
  await page.getByRole("button", { name: /Next: bull-up/ }).click();
  await page.getByRole("button", { name: new RegExp(o.bull ?? "Player 1") }).click();
  await page.getByRole("button", { name: /Start match/ }).click();
}
async function ready(page: Page) {
  await confirm(page);
  await expect(dialog(page)).toBeHidden();
}
// "T20", "D16", "S5", "25", "Bull", "Miss"
async function dart(page: Page, d: string) {
  const mod = ({ S: null, D: "Double", T: "Treble" } as Record<string, string | null>)[d[0]];
  if (/^[SDT]\d/.test(d) && mod) await page.getByRole("button", { name: mod, exact: true }).click();
  await page.getByRole("button", { name: d, exact: true }).click();
}
const visit = async (page: Page, ...ds: string[]) => { for (const d of ds) await dart(page, d); };
const playing = (page: Page, name: string) => page.locator('[aria-current="true"]').filter({ hasText: name });

test("layout is locked to the viewport and tabs show reference content", async ({ page }) => {
  await page.goto("./");
  const [sh, ch, sw, cw] = await page.evaluate(() => [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth]);
  expect(sh).toBeLessThanOrEqual(ch);
  expect(sw).toBeLessThanOrEqual(cw);
  await page.getByRole("button", { name: "Rules" }).click();
  await expect(page.getByRole("heading", { name: "Double out" })).toBeVisible();
  await page.getByRole("button", { name: "Flow" }).click();
  await expect(page.getByRole("heading", { name: /Bull-up/ })).toBeVisible();
  await page.getByRole("button", { name: "Finishes" }).click();
  await expect(page.getByText("T20 · T20 · Bull")).toBeVisible();
  await page.getByRole("button", { name: "Match" }).click();
  await expect(page.getByRole("heading", { name: "Who's playing?" })).toBeVisible();
});

test("wizard: players, options, bull-up winner and order of play", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "+ Add player" }).click();
  await page.getByLabel("Player 3 name").fill("Cy");
  await page.getByRole("button", { name: "Remove player 1" }).click(); // Player 2 + Cy remain
  await page.getByRole("button", { name: /Next: options/ }).click();
  await page.getByRole("button", { name: "701", exact: true }).click();
  await page.getByRole("button", { name: "Straight out" }).click();
  await page.getByRole("button", { name: /Next: bull-up/ }).click();
  await page.getByRole("button", { name: /Cy/ }).click(); // Cy wins the bull
  await expect(page.getByRole("heading", { name: "Order of play" })).toBeVisible();
  await expect(page.locator("ol li").first()).toContainText("Cy");
  await page.getByRole("button", { name: "Move Player 2 up" }).click(); // reorder
  await expect(page.locator("ol li").first()).toContainText("Player 2");
  await page.getByRole("button", { name: /Start match/ }).click();
  await expect(dialog(page)).toContainText("Player 2 throws first");
  await expect(dialog(page)).toContainText("Order of play: Player 2 → Cy");
  await expect(dialog(page)).toContainText("701 · straight out");
});

test("a visit: 3 darts, hand-over prompt, next player highlighted", async ({ page }) => {
  await startMatch(page);
  await expect(dialog(page)).toContainText("Player 1 throws first");
  await ready(page);
  await expect(playing(page, "Player 1")).toBeVisible();
  await visit(page, "T20");
  await expect(page.getByTestId("dart").first()).toHaveText("T20");
  await visit(page, "T20", "T20");
  await expect(dialog(page)).toContainText("Player 1 scored 180!");
  await expect(dialog(page)).toContainText("Player 1: 301 → 121 left");
  await expect(dialog(page)).toContainText("Next up: Player 2 (301 left)");
  await expect(page.getByRole("button", { name: "S5", exact: true })).toBeDisabled(); // keypad locked until confirmed
  await confirm(page);
  await expect(playing(page, "Player 2")).toBeVisible();
  await expect(page.getByTestId("dart").first()).toHaveText("–");
});

test("advice: checkout appears when finishable, with darts remaining", async ({ page }) => {
  await startMatch(page);
  await ready(page);
  await expect(page.getByTestId("advice")).toContainText("SCORE");
  await visit(page, "T20", "T20", "T20");
  await confirm(page);
  await visit(page, "Miss", "Miss", "Miss");
  await confirm(page); // back to Player 1 on 121
  await expect(page.getByTestId("advice")).toContainText("CHECKOUT · 3 darts");
  await dart(page, "T20");
  await expect(page.getByTestId("advice")).toContainText("CHECKOUT · 2 darts");
  await expect(page.getByTestId("advice")).toContainText("T7 · D20");
});

test("bust: leaving 1 on double out reverts the visit", async ({ page }) => {
  await startMatch(page);
  await ready(page);
  await visit(page, "T20", "T20", "T20");
  await confirm(page);
  await visit(page, "Miss", "Miss", "Miss");
  await confirm(page); // Player 1 on 121
  await visit(page, "T20", "T20"); // 121 -> 61 -> 1: bust
  await expect(dialog(page)).toContainText("BUST!");
  await expect(dialog(page)).toContainText("leave 1");
  await expect(dialog(page)).toContainText("Player 1 stays on 121");
  await confirm(page);
  await expect(page.getByText("121").first()).toBeVisible();
  await expect(playing(page, "Player 2")).toBeVisible();
});

test("must finish on a double", async ({ page }) => {
  await startMatch(page, { start: 301 });
  await ready(page);
  await visit(page, "T20", "T20", "T20");
  await confirm(page);
  await visit(page, "Miss", "Miss", "Miss");
  await confirm(page);
  await visit(page, "T20", "T7", "Miss"); // 40 left
  await confirm(page);
  await visit(page, "Miss", "Miss", "Miss");
  await confirm(page);
  await visit(page, "S20", "S20"); // 20 then 0 with a single: bust
  await expect(dialog(page)).toContainText("finish on a double");
});

test("leg won on a double, then next leg starts with the other player", async ({ page }) => {
  await startMatch(page, { legs: 2 });
  await ready(page);
  await visit(page, "T20", "T20", "T20");
  await confirm(page);
  await visit(page, "Miss", "Miss", "Miss");
  await confirm(page);
  await visit(page, "T20", "T7", "Miss");
  await confirm(page);
  await visit(page, "Miss", "Miss", "Miss");
  await confirm(page);
  await visit(page, "D20");
  await expect(dialog(page)).toContainText("Game shot! Player 1 wins leg 1");
  await expect(dialog(page)).toContainText("Finished on D20");
  await expect(dialog(page)).toContainText("Legs: Player 1 1 · Player 2 0");
  await confirm(page);
  await expect(dialog(page)).toContainText("Leg 2");
  await expect(dialog(page)).toContainText("Player 2 throws first");
  await expect(dialog(page)).toContainText("Scores reset to 301");
  await confirm(page);
  await expect(playing(page, "Player 2")).toBeVisible();
});

test("match win shows averages and New match returns to the wizard", async ({ page }) => {
  await startMatch(page);
  await ready(page);
  for (const v of [["T20", "T20", "T20"], ["Miss", "Miss", "Miss"], ["T20", "T7", "Miss"], ["Miss", "Miss", "Miss"]]) {
    await visit(page, ...v);
    await confirm(page);
  }
  await visit(page, "D20");
  await confirm(page); // leg result
  await expect(dialog(page)).toContainText("Player 1 wins the match!");
  await expect(dialog(page)).toContainText("3-dart avg");
  await confirm(page);
    await page.getByRole("button", { name: /New match →/ }).click();
  await expect(page.getByRole("heading", { name: "Who's playing?" })).toBeVisible();
});

test("undo removes the last dart", async ({ page }) => {
  await startMatch(page);
  await ready(page);
  await visit(page, "T20", "S5");
  await expect(page.getByTestId("dart").nth(1)).toHaveText("S5");
  await page.getByRole("button", { name: "↶" }).click();
  await expect(page.getByTestId("dart").nth(1)).toHaveText("–");
  await expect(page.getByTestId("dart").first()).toHaveText("T20");
});

test("names persist in localStorage but a match does not survive reload", async ({ page }) => {
  await startMatch(page, { names: ["Zed", "Yan"], bull: "Zed" });
  await ready(page);
  await visit(page, "T20");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Who's playing?" })).toBeVisible();
  await expect(page.getByLabel("Player 1 name")).toHaveValue("Zed");
  await expect(page.getByLabel("Player 2 name")).toHaveValue("Yan");
});

const VIEWPORTS = [
  ["small phone", 320, 568],
  ["phone", 390, 780],
  ["landscape phone", 667, 375],
  ["tablet", 768, 1024],
  ["laptop", 1280, 720],
  ["desktop", 1920, 1080],
] as const;

for (const [name, width, height] of VIEWPORTS) {
  test(`no page scroll or overflow on ${name} (${width}x${height})`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    // Wizard/reference content may scroll inside its own card (allowed); everything else must fit.
    const check = async (where: string, selectors: string[]) => {
      await page.waitForTimeout(450); // prompt slide-in animation
      const bad = await page.evaluate((sels) => {
        const de = document.documentElement;
        const out: string[] = [];
        if (de.scrollWidth > innerWidth) out.push(`page scrollWidth ${de.scrollWidth}`);
        if (de.scrollHeight > innerHeight) out.push(`page scrollHeight ${de.scrollHeight}`);
        const area = document.querySelector("main > div")!.getBoundingClientRect();
        for (const raw of sels) {
          const inContent = raw.startsWith("@content ");
          const sel = inContent ? raw.slice(9) : raw;
          document.querySelectorAll(sel).forEach((el) => {
            const r = el.getBoundingClientRect();
            if (!r.width || el.closest(".overflow-y-auto") !== null) return;
            const text = `${sel} "${(el.textContent ?? "").slice(0, 16)}"`;
            if (inContent && (r.top < area.top - 0.5 || r.bottom > area.bottom + 0.5 || r.left < area.left - 0.5 || r.right > area.right + 0.5)) {
              out.push(`${text} outside content area ${Math.round(r.top)}-${Math.round(r.bottom)} vs ${Math.round(area.top)}-${Math.round(area.bottom)}`);
            }
            if (r.left < -0.5 || r.top < -0.5 || r.right > innerWidth + 0.5 || r.bottom > innerHeight + 0.5) out.push(`${text} outside viewport`);
          });
        }
        return out;
      }, selectors);
      expect(bad, where).toEqual([]);
    };

    await page.goto("./");
    await check("wizard players", ["header", "nav", "nav button"]);
    await page.getByRole("button", { name: /Next: options/ }).click();
    await check("wizard options", ["nav"]);
    await page.getByRole("button", { name: /Next: bull-up/ }).click();
    await page.getByRole("button", { name: /Player 1/ }).click();
    await check("wizard order", ["nav"]);
    await page.getByRole("button", { name: /Start match/ }).click();
    await check("intro prompt", ["[role=dialog] > div", "[role=dialog] button"]);
    await ready(page);
    await check("match", ["header", "nav", "@content main > div button", "@content main > div p", "@content [data-testid=dart]"]);
    await visit(page, "T20", "T20", "T20");
    await check("hand-over prompt", ["[role=dialog] > div", "[role=dialog] button"]);
    await drainAll(page);
    await visit(page, "Miss", "Miss", "Miss");
    await drainAll(page);
    await check("match with checkout advice", ["@content main > div button", "@content [data-testid=advice]"]);
    for (const tab of ["Rules", "Flow", "Finishes"]) {
      await page.getByRole("button", { name: tab, exact: true }).click();
      await check(`${tab} tab`, ["header", "nav", "nav button"]);
    }
  });
}
