# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| main branch | ✅ |
| tagged releases | ✅ |

Report vulnerabilities affecting any published commit or tag.

## Reporting a Vulnerability

1. Email **security@geekprotocol.xyz** with the subject line `Vulnerability Report: <short summary>`.
2. Include the following details:
   - Affected component(s) (e.g., API, web app, worker, infrastructure).
   - Steps to reproduce or proof-of-concept exploit.
   - Expected vs. actual behavior.
   - Impact assessment (data exposure, privilege escalation, denial of service, etc.).
   - Any temporary mitigations or workarounds you discovered.
3. Optionally include PGP-encrypted details. Our public key fingerprint: **(coming soon)**.

We aim to acknowledge new reports within **2 business days**. Please avoid public disclosure until we have confirmed and patched the issue.

## Scope

- `apps/api` Fastify server and reward worker
- `apps/web` Next.js application (client + server components)
- Shared packages (`packages/shared`)
- Infrastructure manifests (docker-compose, CI workflows)

## Out of Scope

- Third-party services not maintained by the Geek Protocol team
- Social engineering attacks or phishing attempts
- Physical security issues

## Coordinated Disclosure

Once a fix is ready:

1. We will work with you to validate the patch.
2. CVE filing (if applicable) will credit the reporter unless anonymity is requested.
3. Public disclosure (release notes, advisories) will occur only after patches are available.

## Pre-Audit Status

**⚠️ Important:** This project is currently in Alpha and has not yet undergone a third-party security audit. While we have implemented production-oriented security measures (HMAC validation, JWT authentication, rate limiting, etc.), mainnet reward distribution remains disabled until audit completion.

**Responsible Testing:** If you discover a vulnerability in our testnet or demo environments, please report it through the process above rather than exploiting it. We appreciate your cooperation in keeping the Kaspa community and our Alpha testers safe.

Thank you for helping keep Geek Protocol and the Kaspa community safe. 🚀
