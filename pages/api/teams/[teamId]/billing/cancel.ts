/**
 * @deprecated Use App Router equivalent: app/api/teams/[teamId]/billing/cancel/route.ts
 * This route will be removed in Phase 3 of the Pages→App Router migration.
 * All new features should use the App Router version.
 */
import { NextApiRequest, NextApiResponse } from "next";

import { handleRoute } from "@/ee/features/billing/cancellation/api/cancel-route";


export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  return handleRoute(req, res);
}
