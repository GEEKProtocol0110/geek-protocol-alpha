/**
 * Boot-time configuration validation.
 *
 * The failure this exists to prevent: every secret in this codebase had an
 * inline `|| "dev-..."` fallback, so a production deploy that forgot one booted
 * happily and signed real sessions with a secret that is public in the git
 * history. `.env.example` made that near-certain by documenting JWT_SECRET while
 * the live middleware reads SECRET_KEY.
 *
 * In production this module refuses to start the process. In development it
 * warns and carries on, so local work needs no setup.
 */
import crypto from "crypto";
export const IS_PRODUCTION = process.env.NODE_ENV === "production";
/** Values that must never reach production, whatever variable they land in. */
const KNOWN_DEV_DEFAULTS = new Set([
    "dev-secret-key-change-in-production",
    "dev-hmac-secret-change",
    "dev-wallet-encryption-key-change-32chars!!",
    "your-secure-jwt-secret-min-32-chars-please-change-this",
    "your-secure-hmac-secret-min-32-chars-please-change-this",
    "your-secure-attempt-token-secret-please-change-this",
    "replace-with-a-very-long-random-string",
    "changeme",
    "secret",
    "password",
]);
/**
 * Catches placeholder secrets an exact-match list would miss. A real generated
 * secret is high-entropy base64/hex and will not contain English instructions
 * like "replace-with" or "your-secure".
 */
const PLACEHOLDER_PATTERNS = [
    /replace[-_ ]?(with|me|this)/i,
    /change[-_ ]?(me|this|in[-_ ]?production)/i,
    /^your[-_ ]/i,
    /placeholder/i,
    /example/i,
    /^(test|demo|dev|sample)[-_]/i,
    /xxxx/i,
];
function looksLikePlaceholder(value) {
    return PLACEHOLDER_PATTERNS.some((re) => re.test(value));
}
const REQUIRED_SECRETS = [
    {
        name: "SECRET_KEY",
        minLength: 32,
        purpose: "signs session JWTs and cookies — a leak lets anyone forge an admin session",
    },
    {
        name: "HMAC_SECRET",
        minLength: 32,
        purpose: "signs quiz attempt tokens — a leak lets players forge their own scores",
    },
    {
        name: "WALLET_ENCRYPTION_KEY",
        minLength: 32,
        exactBytes: 32,
        purpose: "AES-256 key encrypting custodial wallet private keys",
    },
];
const REQUIRED_PLAIN = [
    { name: "DATABASE_URL", purpose: "PostgreSQL connection string" },
    { name: "REDIS_URL", purpose: "Redis connection string (queues, nonces, caching)" },
    { name: "FRONTEND_ORIGIN", purpose: "comma-separated allowed browser origins for CORS" },
];
export function inspectConfig() {
    const problems = [];
    const level = IS_PRODUCTION ? "error" : "warning";
    for (const spec of REQUIRED_SECRETS) {
        const value = process.env[spec.name];
        if (!value) {
            problems.push({
                level,
                variable: spec.name,
                message: `missing — ${spec.purpose}`,
            });
            continue;
        }
        if (KNOWN_DEV_DEFAULTS.has(value) || looksLikePlaceholder(value)) {
            problems.push({
                level,
                variable: spec.name,
                message: `is a placeholder, not a real secret — ${spec.purpose}`,
            });
            continue;
        }
        if (spec.exactBytes && Buffer.byteLength(value, "utf8") !== spec.exactBytes) {
            problems.push({
                level,
                variable: spec.name,
                message: `must be exactly ${spec.exactBytes} bytes (got ${Buffer.byteLength(value, "utf8")}) — ${spec.purpose}`,
            });
            continue;
        }
        if (value.length < spec.minLength) {
            problems.push({
                level,
                variable: spec.name,
                message: `is only ${value.length} chars, needs ${spec.minLength}+ — ${spec.purpose}`,
            });
            continue;
        }
        // Cheap entropy screen: "aaaaaaaa..." is long but worthless.
        if (new Set(value).size < 8) {
            problems.push({
                level,
                variable: spec.name,
                message: `has too few distinct characters to be a real random secret — ${spec.purpose}`,
            });
        }
    }
    for (const { name, purpose } of REQUIRED_PLAIN) {
        if (!process.env[name]) {
            problems.push({ level, variable: name, message: `missing — ${purpose}` });
        }
    }
    // A stale JWT_SECRET is a live footgun: it looks like the auth secret (and
    // .env.example says so) but nothing reads it.
    if (process.env.JWT_SECRET && !process.env.SECRET_KEY) {
        problems.push({
            level: "error",
            variable: "SECRET_KEY",
            message: "JWT_SECRET is set but SECRET_KEY is not. Sessions are signed with SECRET_KEY; " +
                "JWT_SECRET is not read by the running auth middleware. Rename it to SECRET_KEY.",
        });
    }
    if (IS_PRODUCTION) {
        if (process.env.DEMO_MODE === "true") {
            problems.push({
                level: "error",
                variable: "DEMO_MODE",
                message: "is true in production — this disables wallet signature verification entirely, " +
                    "letting anyone log in as any wallet address.",
            });
        }
        const origins = process.env.FRONTEND_ORIGIN || "";
        if (origins.includes("localhost") || origins.includes("127.0.0.1")) {
            problems.push({
                level: "warning",
                variable: "FRONTEND_ORIGIN",
                message: "contains localhost in production — remove it before going live.",
            });
        }
        // Paying out requires a working transfer implementation; see kaspa.ts.
        if (process.env.ENABLE_REWARDS === "true") {
            if (!process.env.TREASURY_PRIVATE_KEY) {
                problems.push({
                    level: "error",
                    variable: "TREASURY_PRIVATE_KEY",
                    message: "ENABLE_REWARDS is true but no treasury key is configured.",
                });
            }
            if (!process.env.GEEK_TOKEN_TICKER) {
                problems.push({
                    level: "error",
                    variable: "GEEK_TOKEN_TICKER",
                    message: "ENABLE_REWARDS is true but the KRC-20 ticker is not set, so payouts cannot " +
                        "identify which token to send.",
                });
            }
            if (!process.env.KASPA_TRANSFER_PROVIDER) {
                problems.push({
                    level: "error",
                    variable: "KASPA_TRANSFER_PROVIDER",
                    message: "ENABLE_REWARDS is true but no on-chain transfer provider is configured. " +
                        "Refusing to start rather than record payouts that never settle.",
                });
            }
        }
    }
    return problems;
}
/** Formats problems for a terminal, newest-operator-friendly. */
export function formatProblems(problems) {
    const errors = problems.filter((p) => p.level === "error");
    const warnings = problems.filter((p) => p.level === "warning");
    const lines = [];
    if (errors.length) {
        lines.push(`\n  ${errors.length} configuration error(s):`);
        for (const p of errors)
            lines.push(`   ✗ ${p.variable}: ${p.message}`);
    }
    if (warnings.length) {
        lines.push(`\n  ${warnings.length} configuration warning(s):`);
        for (const p of warnings)
            lines.push(`   ! ${p.variable}: ${p.message}`);
    }
    return lines.join("\n");
}
/**
 * Call before anything binds a port or opens a connection. Throws in production
 * when the configuration is unsafe; only warns in development.
 */
export function assertProductionConfig(log = console.error) {
    const problems = inspectConfig();
    if (problems.length === 0)
        return;
    log(formatProblems(problems));
    const errors = problems.filter((p) => p.level === "error");
    if (errors.length > 0) {
        log("\n  Refusing to start with an unsafe configuration.\n" +
            "  Generate strong secrets with:  npm run gen:secrets  (in apps/api)\n");
        throw new Error(`Invalid production configuration: ${errors.length} error(s)`);
    }
}
/** Secret material suitable for pasting into a production env file. */
export function generateSecrets() {
    return {
        SECRET_KEY: crypto.randomBytes(48).toString("base64url"),
        HMAC_SECRET: crypto.randomBytes(48).toString("base64url"),
        // Exactly 32 bytes: AES-256 keys the raw UTF-8 bytes of this value.
        WALLET_ENCRYPTION_KEY: crypto.randomBytes(24).toString("base64"),
    };
}
