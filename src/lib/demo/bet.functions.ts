import { createServerFn } from "@tanstack/react-start";
import { getRequestHost, getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

const PayloadSchema = z.object({
  transactionId: z.string().min(1),
  wager: z.number().positive(),
  gameId: z.string().min(1),
  category: z.string().optional(),
  jackpotId: z.number().int().positive(),
  clientTimestamp: z.string().min(1),
  clientTimezone: z.string().min(1),
  playerSegments: z.array(z.string()).optional(),
  brandId: z.string().min(1),
});

/**
 * Server-side proxy to /api/v1/event/bet that injects the internal VPC
 * handshake secret. The /demo page calls this so the INTERNAL_SERVICE_SECRET
 * never reaches the browser bundle.
 */
export const placeDemoBet = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PayloadSchema.parse(input))
  .handler(async ({ data }) => {
    const secret = process.env.INTERNAL_SERVICE_SECRET;
    if (!secret) {
      return {
        ok: false as const,
        status: 503,
        code: "INTERNAL_SECRET_NOT_SET",
        message: "INTERNAL_SERVICE_SECRET is not configured on this environment.",
      };
    }

    const host = getRequestHost();
    const forwardedProto = getRequestHeader("x-forwarded-proto");
    const proto =
      forwardedProto ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
    const url = `${proto}://${host}/api/v1/event/bet`;

    const { brandId, ...betPayload } = data;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
        "x-brand-id": brandId,
      },
      body: JSON.stringify(betPayload),
    });

    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, status: res.status, body };
  });
