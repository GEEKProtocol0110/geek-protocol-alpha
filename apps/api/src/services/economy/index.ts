/**
 * The economy module's public surface.
 *
 * Game code should import from here and nowhere deeper — every balance change
 * in GEEK Protocol goes through `economyService(prisma)`.
 */

export * from "./units";
export * from "./types";
export * from "./rules";
export * from "./config";
export * from "./budget";
export * from "./breakers";
export * from "./treasury";
export * from "./service";
export { WithdrawalService, ALPHA_DISABLED_MESSAGE } from "./withdrawals";
export type { WithdrawalRequestResult, WithdrawalRefusal } from "./withdrawals";
export { BurnService } from "./burn";
export {
  applyMovement,
  reverseMovement,
  withEconomyTransaction,
  lockUser,
  lockResource,
  InsufficientBalanceError,
  TreasuryExhaustedError,
} from "./ledger";
export type { Tx, MovementResult } from "./ledger";
