import { generateKeypair } from "./kaspaCrypto";
/**
 * Generate a new Kaspa keypair.
 *
 * Previously this produced fake `kaspatest:demo<random>` strings in DEMO_MODE
 * and required the uninstalled `@kaspa/core` otherwise. It now always returns a
 * real, valid keypair for the configured network — a demo build getting
 * cryptographically valid addresses costs nothing and means test data behaves
 * like production data.
 */
export async function generateKaspaKeypair() {
    const { address, privateKey } = generateKeypair();
    return { address, privateKey };
}
