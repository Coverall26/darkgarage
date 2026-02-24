/**
 * @deprecated Use App Router equivalent: app/api/teams/[teamId]/billing/route.ts
 * This route will be removed in Phase 3 of the Pages→App Router migration.
 * All new features should use the App Router version.
 */
import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { authOptions } from "@/lib/auth/auth-options";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // POST /api/teams/:teamId/billing – get user's subscription info
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const { teamId } = req.query as { teamId: string };

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
        },
        select: {
          id: true,
          subscriptionId: true,
          startsAt: true,
          endsAt: true,
          plan: true,
          _count: {
            select: {
              documents: true,
            },
          },
        },
      });
      if (!team) {
        return res.status(400).json({ error: "Team does not exists" });
      }
      return res.status(200).json(team);
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
