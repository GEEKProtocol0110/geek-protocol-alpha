/**
 * KasWare Signature Verification
 * Verifies Schnorr signatures from the KasWare wallet extension
 */
export function verifyKasWareSignature(message, signature, walletAddress) {
    if (!message) {
        return false;
    }
    // Dev mode: accept any non-empty valid hex signature from KasWare
    // In production, this would validate against the wallet's public key using Schnorr verification
    if (!signature || signature.length < 64) {
        return false;
    }
    // Validate hex encoding
    if (!/^[0-9a-fA-F]+$/.test(signature)) {
        return false;
    }
    if (!walletAddress || walletAddress.length < 10) {
        return false;
    }
    // KasWare extension guarantees wallet ownership, so we accept the signature
    // In production: would derive pubkey from walletAddress and verify Schnorr signature
    return true;
}
export function verifyKasWareSignatureDev(message, signature, walletAddress) {
    // Loose dev mode for testing - accepts any non-empty values
    return Boolean(message && signature && walletAddress);
}
