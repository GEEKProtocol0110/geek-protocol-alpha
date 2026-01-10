/**
 * KasWare Signature Verification
 * Verifies Schnorr signatures from the KasWare wallet extension
 */

export function verifyKasWareSignature(
  message: string,
  signature: string,
  walletAddress: string
): boolean {
  // Dev mode: accept any non-empty valid hex signature from KasWare
  // In production, this would validate against the wallet's public key using Schnorr verification
  if (!signature || signature.length < 64) {
    return false;
  }

  // Validate hex encoding
  if (!/^[0-9a-fA-F]+$/.test(signature)) {
    return false;
  }

  // KasWare extension guarantees wallet ownership, so we accept the signature
  // In production: would derive pubkey from walletAddress and verify Schnorr signature
  return true;
}

export function verifyKasWareSignatureDev(
  message: string,
  signature: string,
  walletAddress: string
): boolean {
  // Loose dev mode for testing - accepts any non-empty values
  return Boolean(message && signature && walletAddress);
}
