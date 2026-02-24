/**
 * PATCH /api/teams/[teamId]/crm-role — Update a team member's CRM role.
 *
 * Body: { userId: string, crmRole: "VIEWER" | "CONTRIBUTOR" | "MANAGER" }
 * Auth: Requires ADMIN+ team role.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/prisma";
import { reportError } from "@/lib/error";
import { appRouterRateLimit } from "@/lib/security/rate-limiter";
import { validateBody } from "@/lib/middleware/validate";
import { CrmRoleUpdateSchema } from "@/lib/validations/teams";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["OWNER", "SUPER_ADMIN", "ADMIN"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const blocked = await appRouterRateLimit(req);
  if (blocked) return blocked;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    // Verify requester is admin of this team
    const requesterTeam = await prisma.userTeam.findFirst({
      where: { teamId, userId: session.user.id },
      select: { role: true },
    });

    if (!requesterTeam || !ADMIN_ROLES.includes(requesterTeam.role)) {
      return NextResponse.json(
        { error: "Forbidden: Admin role required to manage CRM roles" },
        { status: 403 },
      );
    }

    // Validate body with Zod schema
    const parsed = await validateBody(req, CrmRoleUpdateSchema);
    if (parsed.error) return parsed.error;
    const { userId, crmRole } = parsed.data;

    // Verify target user is a member of this team
    const targetMember = await prisma.userTeam.findFirst({
      where: { teamId, userId },
      select: { role: true, userId: true },
    });

    if (!targetMember) {
      return NextResponse.json(
        { error: "User is not a member of this team" },
        { status: 404 },
      );
    }

    // Update CRM role
    await prisma.userTeam.update({
      where: {
        userId_teamId: { userId, teamId },
      },
      data: { crmRole },
    });

    return NextResponse.json({ success: true, userId, crmRole });
  } catch (error) {
    reportError(error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
