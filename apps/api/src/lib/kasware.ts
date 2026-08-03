/**
 * Kaspa signature verification.
 *
 * The previous implementation dynamically imported `@kaspa/core`, which is not
 * an installed dependency. That import always failed, so this function returned
 * false for every request and wallet login was impossible whenever DEMO_MODE was
 * off. The working implementation now lives in kaspaCrypto.ts and uses
 * @noble/curves with no native dependency.
 *
 * Re-exported from here so existing imports keep working.
 */
export { verifyKaspaSignature } from "./kaspaCrypto";
