import { logger } from "./logger";

const DEMO_MODE = process.env.DEMO_MODE === "true";

// Generate a new Kaspa keypair
export async function generateKaspaKeypair(): Promise<{ address: string; privateKey: string }> {
  if (DEMO_MODE) {
    // Generate demo keypair
    const address = `kaspatest:demo${Math.random().toString(36).substring(2, 15)}`;
    const privateKey = `demo_priv_${Math.random().toString(36).substring(2, 32)}`;
    return { address, privateKey };
  }

  try {
    // Load Kaspa core dynamically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kaspaCore: any = await (Function('return m => import(m)')())('@kaspa/core');
    if (!kaspaCore) {
      throw new Error("@kaspa/core not available");
    }

    // Generate new private key
    const privateKey = kaspaCore.PrivateKey.random();
    const address = privateKey.toAddress(kaspaCore.Network.TESTNET); // Use TESTNET for now

    return {
      address: address.toString(),
      privateKey: privateKey.toString(),
    };
  } catch (error) {
    logger.error({ error }, "Failed to generate Kaspa keypair");
    throw new Error("Failed to generate wallet");
  }
}
