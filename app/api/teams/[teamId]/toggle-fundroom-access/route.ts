import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/prisma";
import { reportError } from "@/lib/error";
import { validateBody } from "@/lib/middleware/validate";
import { ToggleFundroomAccessSchema } from "@/lib/validations/teams";

export const dynamic = "force-dynamic";

/**
 * PUT /api/teams/[teamId]/toggle-fundroom-access
 *
 * Toggle a user's hasFundroomAccess on a team.
 * Only admins can change fundroom access. Super admins always have access.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Validate body with Zod schema
    const parsed = await validateBody(req, ToggleFundroomAccessSchema);
    if (parsed.error) return parsed.error;
    const { userId, hasFundroomAccess } = parsed.data;

    const currentUser = await prisma.userTeam.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId,
        },
      },
    });

    if (!currentUser || !["ADMIN", "OWNER", "SUPER_ADMIN"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Only admins can change fundroom access" }, { status: 403 });
    }

    const targetUser = await prisma.userTeam.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found in team" }, { status: 404 });
    }

    if (targetUser.role === "ADMIN") {
      return NextResponse.json({ error: "Super admins always have fundroom access" }, { status: 400 });
    }

    await prisma.userTeam.update({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
      data: {
        hasFundroomAccess,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError(error as Error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
