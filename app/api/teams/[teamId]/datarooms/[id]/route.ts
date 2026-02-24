import { NextRequest, NextResponse } from "next/server";

import { DefaultPermissionStrategy } from "@prisma/client";
import { getServerSession } from "next-auth/next";

import { getFeatureFlags } from "@/lib/featureFlags";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { authOptions } from "@/lib/auth/auth-options";
import { reportError } from "@/lib/error";
import { appRouterRateLimit } from "@/lib/security/rate-limiter";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string; id: string }> },
) {
  const blocked = await appRouterRateLimit(req);
  if (blocked) return blocked;

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId, id: dataroomId } = await params;
  const userId = (session.user as CustomUser).id;

  try {
    const teamAccess = await prisma.userTeam.findUnique({
      where: {
        userId_teamId: {
          userId: userId,
          teamId: teamId,
        },
      },
    });
    if (!teamAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dataroom = await prisma.dataroom.findUnique({
      where: {
        id: dataroomId,
        teamId,
      },
      include: {
        _count: { select: { viewerGroups: true, permissionGroups: true } },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!dataroom) {
      return NextResponse.json(
        { error: "The requested dataroom does not exist" },
        { status: 404 },
      );
    }

    return NextResponse.json(dataroom);
  } catch (error) {
    reportError(error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string; id: string }> },
) {
  const blocked = await appRouterRateLimit(req);
  if (blocked) return blocked;

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId, id: dataroomId } = await params;
  const userId = (session.user as CustomUser).id;

  try {
    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
        users: {
          some: {
            userId: userId,
          },
        },
      },
      select: {
        id: true,
        plan: true,
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      enableChangeNotifications,
      defaultPermissionStrategy,
      allowBulkDownload,
      showLastUpdated,
      tags,
      agentsEnabled,
    } = body as {
      name?: string;
      enableChangeNotifications?: boolean;
      defaultPermissionStrategy?: DefaultPermissionStrategy;
      allowBulkDownload?: boolean;
      showLastUpdated?: boolean;
      tags?: string[];
      agentsEnabled?: boolean;
    };

    const featureFlags = await getFeatureFlags({ teamId: team.id });

    const updatedDataroom = await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
      const dataroom = await tx.dataroom.update({
        where: {
          id: dataroomId,
        },
        data: {
          ...(name && { name }),
          ...(typeof enableChangeNotifications === "boolean" && {
            enableChangeNotifications,
          }),
          ...(defaultPermissionStrategy && { defaultPermissionStrategy }),
          ...(typeof allowBulkDownload === "boolean" && {
            allowBulkDownload,
          }),
          ...(typeof showLastUpdated === "boolean" && {
            showLastUpdated,
          }),
          ...(typeof agentsEnabled === "boolean" && {
            agentsEnabled,
          }),
        },
      });

      // Handle tags if provided
      if (tags !== undefined) {
        // Validate that all tags exist and belong to the same team
        if (tags.length > 0) {
          const validTags = await tx.tag.findMany({
            where: {
              id: { in: tags },
              teamId: teamId,
            },
            select: { id: true },
          });
          const validTagIds = new Set(validTags.map((t) => t.id));
          const invalidTags = tags.filter((id) => !validTagIds.has(id));
          if (invalidTags.length > 0) {
            throw new Error(`Invalid tag IDs: ${invalidTags.join(", ")}`);
          }
        }

        // First, delete all existing tags for this dataroom
        await tx.tagItem.deleteMany({
          where: {
            dataroomId: dataroomId,
            itemType: "DATAROOM_TAG",
          },
        });

        // Then create the new tags (if any)
        if (tags.length > 0) {
          await tx.tagItem.createMany({
            data: tags.map((tagId: string) => ({
              tagId,
              itemType: "DATAROOM_TAG",
              dataroomId: dataroomId,
              taggedBy: userId,
            })),
          });
        }
      }

      // Fetch the updated dataroom with tags
      const dataroomTags = await tx.tag.findMany({
        where: {
          items: {
            some: { dataroomId: dataroom.id },
          },
        },
        select: {
          id: true,
          name: true,
          color: true,
          description: true,
        },
      });

      return { ...dataroom, tags: dataroomTags };
    });

    return NextResponse.json(updatedDataroom);
  } catch (error) {
    reportError(error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string; id: string }> },
) {
  const blocked = await appRouterRateLimit(req);
  if (blocked) return blocked;

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as CustomUser).id;
  const { teamId, id: dataroomId } = await params;

  try {
    const teamAccess = await prisma.userTeam.findUnique({
      where: {
        userId_teamId: {
          userId: userId,
          teamId: teamId,
        },
      },
      select: {
        role: true,
      },
    });

    if (!teamAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (teamAccess.role !== "ADMIN" && teamAccess.role !== "MANAGER") {
      return NextResponse.json(
        {
          error:
            "You are not permitted to perform this action. Only admin and managers can delete datarooms.",
        },
        { status: 403 },
      );
    }

    await prisma.dataroom.delete({
      where: {
        id: dataroomId,
        teamId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    reportError(error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
