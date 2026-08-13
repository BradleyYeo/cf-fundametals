import { paymentMiddleware } from "x402-next";

/**
 * x402 Payment Middleware
 *
 * Protects all /api/* routes by requiring micropayments (USDC on Base).
 *
 * Protocol flow for a paying client (e.g. an AI agent):
 *   1. Agent hits /api/* without payment → server returns HTTP 402 with
 *      payment requirements encoded in the X-Payment header
 *   2. Agent constructs a signed USDC payment on Base and retries with
 *      X-Payment-Response header attached
 *   3. Coinbase's facilitator verifies the on-chain payment
 *   4. Server returns 200 with the resource
 *
 * HTML pages (/, about, etc.) are NOT protected — only /api/* routes.
 * The `matcher` config below ensures Next.js never even invokes this
 * middleware for page requests, so there's zero impact on regular users
 * or crawlers like Googlebot.
 */
export default paymentMiddleware(
  // Your Coinbase wallet address that receives USDC payments
  "0xE04c6c2A20b38c8Fb9A8E7Cafa89eA4763B50d9D",
  {
    // Protect all /api/* routes
    "/api/*": {
      price: "$0.001",        // 0.1 cents USDC per request
      network: "base-sepolia", // testnet — change to "base" for mainnet
    },
  }
  // No custom facilitator config — defaults to https://x402.org/facilitator
);

export const config = {
  // Only run this middleware on /api/* routes.
  // All other routes (/, HTML pages) bypass this entirely.
  matcher: ["/api/:path*"],
};
