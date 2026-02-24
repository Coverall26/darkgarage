import { z } from "zod";

import { verifyQstashSignature } from "@/lib/cron/verify-qstash";
import prisma from "@/lib/prisma";
import { getSearchParams } from "@/lib/utils/get-search-params";
import { WEBHOOK_TRIGGERS } from "@/lib/webhook/constants";
import {
  webhookCallbackSchema,
  webhookPayloadSchema,
} from "@/lib/zod/schemas/webhooks";

export const dynamic = 'force-dynamic';

const searchParamsSchema = z.object({
  webhookId: z.string(),
  eventId: z.string(),
  event: z.enum(WEBHOOK_TRIGGERS),
});

// POST /api/webhooks/callback – listen to webhooks status from QStash
export const POST = async (req: Request) => {
  const rawBody = await req.text();
  await verifyQstashSignature({
    req,
    rawBody,
  });

  const { url, status, body, sourceBody, sourceMessageId } =
    webhookCallbackSchema.parse(JSON.parse(rawBody));

  const { webhookId, eventId, event } = searchParamsSchema.parse(
    getSearchParams(req.url),
  );

  const webhook = await prisma.webhook.findUnique({
    where: { pId: webhookId },
  });

  if (!webhook) {
    console.error("Webhook not found", { webhookId });
    return new Response("Webhook not found");
  }

  const request = Buffer.from(sourceBody, "base64").toString("utf-8");
  const response = Buffer.from(body, "base64").toString("utf-8");
  const isFailed = status >= 400 || status === -1;

  // Log webhook delivery result
  if (isFailed) {
    console.error("Webhook delivery failed", {
      webhookId,
      eventId,
      event,
      status,
      url,
    });
  }

  return new Response(`Webhook ${webhookId} processed`);
};
