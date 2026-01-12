/* scripts/make-assets.cjs */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const pngToIcoModule = require("png-to-ico");
const pngToIco = pngToIcoModule.default ?? pngToIcoModule;

const ROOT = process.cwd();
const logoPath = path.join(ROOT, "public", "logo.png");
const outFavicon = path.join(ROOT, "public", "favicon.ico");
const outOg = path.join(ROOT, "public", "og.png");

function assertExists(p) {
  if (!fs.existsSync(p)) {
    console.error(`❌ Missing file: ${p}`);
    process.exit(1);
  }
}

(async () => {
  assertExists(logoPath);

  // ---- 1) OG IMAGE (1200x630) ----
  const width = 1200;
  const height = 630;

  // background (black + subtle glow) using SVG overlay
  const bgSvg = Buffer.from(`
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="g1" cx="70%" cy="20%" r="80%">
        <stop offset="0%" stop-color="#2dd4bf" stop-opacity="0.18"/>
        <stop offset="45%" stop-color="#60a5fa" stop-opacity="0.10"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="g2" cx="15%" cy="80%" r="70%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="#000000"/>
    <rect width="100%" height="100%" fill="url(#g1)"/>
    <rect width="100%" height="100%" fill="url(#g2)"/>
  </svg>
  `);

  // text overlay via SVG (clean + crisp)
  const textSvg = Buffer.from(`
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .title { font: 700 72px Arial, Helvetica, sans-serif; fill: #ffffff; }
      .tag   { font: 400 30px Arial, Helvetica, sans-serif; fill: rgba(255,255,255,0.78); }
      .motto { font: 600 26px Arial, Helvetica, sans-serif; fill: rgba(255,255,255,0.85); }
    </style>

    <text x="460" y="270" class="title">Geek Protocol</text>
    <text x="460" y="330" class="tag">Your Knowledge is Now an Asset.</text>
    <text x="460" y="390" class="motto">All hope, no hype.</text>
  </svg>
  `);

  // prepare logo (fit inside a nice box)
  const logoPng = await sharp(logoPath)
    .resize(260, 260, { fit: "contain", withoutEnlargement: true })
    .png()
    .toBuffer();

  // compose OG
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: "#000000",
    },
  })
    .composite([
      { input: bgSvg, left: 0, top: 0 },
      // logo box
      {
        input: await sharp({
          create: { width: 320, height: 320, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0.06 } },
        })
          .png()
          .toBuffer(),
        left: 100,
        top: 155,
      },
      { input: logoPng, left: 130, top: 185 },
      { input: textSvg, left: 0, top: 0 },
    ])
    .png()
    .toFile(outOg);

  console.log("✅ Created:", path.relative(ROOT, outOg));

  // ---- 2) FAVICON.ICO ----
  const sizes = [16, 32, 48, 64, 128, 256];
  const pngBuffers = await Promise.all(
    sizes.map((s) =>
      sharp(logoPath)
        .resize(s, s, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    )
  );

  const icoBuffer = await pngToIco(pngBuffers);
  fs.writeFileSync(outFavicon, icoBuffer);

  console.log("✅ Created:", path.relative(ROOT, outFavicon));
  console.log("🎉 Done. Commit + push and Vercel will update.");
})().catch((err) => {
  console.error("❌ Asset generation failed:", err);
  process.exit(1);
});
