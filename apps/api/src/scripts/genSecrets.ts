/**
 * Prints a set of freshly generated production secrets, ready to paste into an
 * environment file or a hosting provider's secret manager.
 *
 * Run:  npm run gen:secrets   (from apps/api)
 */
import { generateSecrets } from "../lib/config";

const secrets = generateSecrets();

console.log("\n# ─── Generated secrets — store these in your secret manager ───");
console.log("# Generated:", new Date().toISOString());
console.log("# Anyone holding SECRET_KEY can forge admin sessions.");
console.log("# Anyone holding HMAC_SECRET can forge quiz scores.");
console.log("# Losing WALLET_ENCRYPTION_KEY makes every custodial wallet unrecoverable —");
console.log("# back it up before you deploy, and never rotate it while wallets exist.\n");

for (const [key, value] of Object.entries(secrets)) {
  console.log(`${key}="${value}"`);
}

console.log("\n# WALLET_ENCRYPTION_KEY must stay exactly 32 bytes; do not edit it.\n");
