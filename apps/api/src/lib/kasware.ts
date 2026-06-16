/**
 * Kaspa Schnorr signature verification.
 *
 * In DEMO_MODE (env DEMO_MODE=true) real verification is skipped so the
 * full flow can be exercised without the @kaspa/core native binaries.
 *
 * In production the function derives the 32-byte x-only public key from the
 * Kaspa bech32 address payload and verifies a Schnorr signature with
 * @noble/curves (which ships as a transitive dep of several Kaspa packages).
 */

const DEMO_MODE = process.env.DEMO_MODE === "true";

export async function verifyKaspaSignature(
  walletAddress: string,
  message: string,
  signature: string
): Promise<boolean> {
  if (DEMO_MODE) return true;

  try {
    // @kaspa/core is an optional peer – load dynamically so the module
    // compiles cleanly even when the native binary is absent.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kaspaCore: any = await (Function('return m => import(m)')())('@kaspa/core').catch(() => null);
    if (!kaspaCore) return false;

    // Decode bech32 address → 33-byte compressed public key → drop version byte
    const parsed = kaspaCore.Address.fromString(walletAddress);
    const pubKeyBytes: Uint8Array = parsed.payload.slice(1); // 32-byte x-only key

    // Hash the UTF-8 message with SHA-256
    const msgBytes = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBytes);
    const msgHash = new Uint8Array(hashBuffer);

    // Decode hex signature
    const sigBytes = new Uint8Array(
      signature.match(/.{1,2}/g)!.map((b) => parseInt(b, 16))
    );

    // Verify Schnorr signature using @noble/curves (BIP-340 compatible)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { schnorr }: any = await (Function('return m => import(m)')())('@noble/curves/secp256k1');
    return schnorr.verify(sigBytes, msgHash, pubKeyBytes);
  } catch {
    return false;
  }
}
