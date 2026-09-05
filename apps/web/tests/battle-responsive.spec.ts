import { test, expect } from "@playwright/test";

/**
 * The battle has one hard layout requirement: at any screen size the player can
 * see the fight and every answer at the same time. If an answer needs scrolling
 * to reach, the timer is running while the player hunts for it.
 *
 * These sizes are the ones that actually broke during development — a 320px
 * phone, and a phone held sideways, where the alpha banner eats a third of the
 * screen.
 */
const VIEWPORTS = [
  { name: "small phone", width: 320, height: 568 },
  { name: "android", width: 360, height: 640 },
  { name: "iphone", width: 390, height: 844 },
  { name: "phone landscape", width: 667, height: 375 },
  { name: "tablet portrait", width: 768, height: 1024 },
  { name: "tablet landscape", width: 1024, height: 768 },
  { name: "laptop", width: 1440, height: 900 },
];

for (const vp of VIEWPORTS) {
  test(`battle fits on ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/battle");

    await page.getByRole("button", { name: "SELECT FIGHTER" }).click();
    await page.getByRole("button", { name: "ENGAGE" }).click();
    // The stage scrolls itself into view on start; let that settle.
    await page.waitForTimeout(1500);

    // Nothing may scroll sideways, at any size.
    const horizontal = await page.evaluate(() => {
      const de = document.documentElement;
      return de.scrollWidth > de.clientWidth;
    });
    expect(horizontal, "page must not scroll horizontally").toBe(false);

    // All four answers on screen at once.
    const answers = await page.evaluate(() => {
      const btns = [...document.querySelectorAll("button")].filter((b) =>
        /^[ABCD]/.test((b as HTMLElement).innerText.trim())
      );
      return btns.map((b) => {
        const r = b.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom };
      });
    });
    expect(answers).toHaveLength(4);
    for (const [i, a] of answers.entries()) {
      expect(a.top, `answer ${i} above the fold`).toBeGreaterThanOrEqual(-1);
      expect(a.bottom, `answer ${i} below the fold`).toBeLessThanOrEqual(vp.height + 1);
    }

    // Both combatants and the HP bars stay visible — it has to read as a fight.
    for (const sel of [".bf-stage-arena", ".bf-stage-hud"]) {
      const box = await page.locator(sel).boundingBox();
      expect(box, `${sel} present`).not.toBeNull();
      expect(box!.height, `${sel} has height`).toBeGreaterThan(24);
      expect(box!.y, `${sel} on screen`).toBeLessThan(vp.height);
    }

    // Answer targets stay tappable.
    const minHeight = Math.min(...answers.map((a) => a.bottom - a.top));
    expect(minHeight, "answer tap target").toBeGreaterThanOrEqual(32);
  });
}
