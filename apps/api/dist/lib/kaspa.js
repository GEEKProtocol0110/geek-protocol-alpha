import { logger } from "./logger";
import { generateKeypair, addressFromPrivateKey } from "./kaspaCrypto";
import { isValidKaspaAddress, networkPrefix } from "./kaspaAddress";
const KASPA_NETWORK = process.env.KASPA_NETWORK || "mainnet";
const KASPLEX_API = process.env.KASPLEX_API_URL || "https://api.kasplex.org";
const PROVIDER = (process.env.KASPA_TRANSFER_PROVIDER || "none");
const GEEK_TICKER = process.env.GEEK_TOKEN_TICKER || "";
export class TransferNotConfiguredError extends Error {
    constructor(detail) {
        super(`KRC-20 transfer is not configured: ${detail}. ` +
            `Set KASPA_TRANSFER_PROVIDER and GEEK_TOKEN_TICKER, or keep ENABLE_REWARDS=false ` +
            `so balances stay off-chain instead of being recorded as settled.`);
        this.name = "TransferNotConfiguredError";
    }
}
/** Generate a new custodial wallet for the configured network. */
export async function generateKaspaWallet() {
    const { address, privateKey } = generateKeypair();
    return { address, privateKey };
}
/** Derive the address controlled by a private key (used to identify the treasury). */
export async function createWalletFromPrivateKey(privateKey) {
    return { address: addressFromPrivateKey(privateKey), privateKey };
}
/**
 * Send KRC-20 tokens.
 *
 * Returns a real transaction id on success. Throws on any condition where the
 * transfer did not demonstrably happen — the payout worker treats a throw as a
 * retryable failure and leaves the reward unsettled, which is the correct
 * outcome. It must never return a value that merely looks like a txid.
 */
export async function sendKrc20Tokens(privateKey, toAddress, tokenId, amount) {
    if (!privateKey)
        throw new TransferNotConfiguredError("no treasury private key");
    const expectedPrefix = networkPrefix(KASPA_NETWORK);
    if (!isValidKaspaAddress(toAddress, expectedPrefix)) {
        // Refuse before broadcasting: a malformed destination burns real funds.
        throw new Error(`Refusing to send to an invalid ${expectedPrefix} address: ${toAddress}`);
    }
    const numericAmount = BigInt(amount);
    if (numericAmount <= 0n)
        throw new Error(`Refusing to send a non-positive amount: ${amount}`);
    switch (PROVIDER) {
        case "kasplex":
            return sendViaKasplex(privateKey, toAddress, tokenId || GEEK_TICKER, amount);
        case "none":
        default:
            throw new TransferNotConfiguredError(`KASPA_TRANSFER_PROVIDER is "${PROVIDER}"`);
    }
}
/**
 * Kasplex-backed transfer.
 *
 * Kasplex indexes KRC-20 but does not custody or broadcast on your behalf: the
 * commit/reveal pair must be built, signed and submitted by this service. That
 * work is deliberately not stubbed here — a half-implementation that returns
 * early would recreate exactly the bug this file exists to remove.
 */
async function sendViaKasplex(_privateKey, toAddress, ticker, amount) {
    if (!ticker)
        throw new TransferNotConfiguredError("GEEK_TOKEN_TICKER is empty");
    logger.error({ toAddress, ticker, amount, network: KASPA_NETWORK, api: KASPLEX_API }, "KRC-20 transfer requested but the commit/reveal signer is not implemented");
    throw new TransferNotConfiguredError("the Kasplex commit/reveal signer is not implemented yet. " +
        "Implement buildCommitReveal() against your funded treasury before enabling rewards");
}
/** Read a KRC-20 balance from the indexer. Safe to call — read-only. */
export async function getKrc20Balance(address, ticker = GEEK_TICKER) {
    if (!ticker)
        return "0";
    try {
        const res = await fetch(`${KASPLEX_API}/v1/krc20/address/${encodeURIComponent(address)}/token/${encodeURIComponent(ticker)}`);
        if (!res.ok)
            return "0";
        const data = (await res.json());
        return data?.result?.[0]?.balance ?? "0";
    }
    catch (error) {
        logger.error({ error, address, ticker }, "Failed to read KRC-20 balance");
        return "0";
    }
}
