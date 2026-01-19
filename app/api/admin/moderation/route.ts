import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const moderationRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["keyword", "pattern", "ai"]),
  pattern: z.string().optional(),
  action: z.enum(["flag", "hide", "delete", "notify"]),
  isActive: z.boolean().optional(),
});

// GET /api/admin/moderation - Get moderation data
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin permission
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN" && user?.role !== "MODERATOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // reports, appeals, rules, queue
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    if (type === "reports") {
      const where: any = {};
      if (status) where.status = status;

      const [reports, total] = await Promise.all([
        prisma.contentReport.findMany({
          where,
          include: {
            reporter: {
              select: {
                id: true,
                name: true,
                email: true,
                trustScore: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.contentReport.count({ where }),
      ]);

      return NextResponse.json({
        reports,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } else if (type === "appeals") {
      const where: any = {};
      if (status) where.status = status;

      const [appeals, total] = await Promise.all([
        prisma.appeal.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                trustScore: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.appeal.count({ where }),
      ]);

      return NextResponse.json({
        appeals,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } else if (type === "rules") {
      const rules = await prisma.moderationRule.findMany({
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ rules });
    } else {
      // Default: moderation queue (pending reports + appeals)
      const [pendingReports, pendingAppeals, recentActions] = await Promise.all([
        prisma.contentReport.count({ where: { status: "PENDING" } }),
        prisma.appeal.count({ where: { status: "PENDING" } }),
        prisma.activityLog.findMany({
          where: {
            action: "MODERATION",
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

      return NextResponse.json({
        queue: {
          pendingReports,
          pendingAppeals,
        },
        recentActions,
      });
    }
  } catch (error) {
    console.error("Get moderation data error:", error);
    return NextResponse.json(
      { error: "Failed to get moderation data" },
      { status: 500 }
    );
  }
}

// POST /api/admin/moderation - Create moderation rule or handle action
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin permission
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { type } = body;

    if (type === "rule") {
      const validationResult = moderationRuleSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Invalid input", details: validationResult.error.issues },
          { status: 400 }
        );
      }

      const rule = await prisma.moderationRule.create({
        data: {
          name: validationResult.data.name,
          description: validationResult.data.description,
          type: validationResult.data.type,
          pattern: validationResult.data.pattern,
          action: validationResult.data.action,
          isActive: validationResult.data.isActive ?? true,
        },
      });

      return NextResponse.json({ success: true, rule });
    } else if (type === "action") {
      // Take moderation action
      const { targetType, targetId, action, reason } = body;

      if (!targetType || !targetId || !action) {
        return NextResponse.json(
          { error: "targetType, targetId, and action are required" },
          { status: 400 }
        );
      }

      // Handle different target types
      if (targetType === "review") {
        const review = await prisma.review.findUnique({ where: { id: targetId } });
        if (!review) {
          return NextResponse.json({ error: "Review not found" }, { status: 404 });
        }

        if (action === "hide") {
          await prisma.review.update({
            where: { id: targetId },
            data: {
              status: "HIDDEN",
              moderatedBy: session.user.id,
              moderatedAt: new Date(),
            },
          });
        } else if (action === "delete") {
          await prisma.review.update({
            where: { id: targetId },
            data: {
              status: "DELETED",
              moderatedBy: session.user.id,
              moderatedAt: new Date(),
            },
          });
        } else if (action === "approve") {
          await prisma.review.update({
            where: { id: targetId },
            data: {
              status: "PUBLISHED",
              flagReason: null,
            },
          });
        }
      } else if (targetType === "user") {
        const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
        if (!targetUser) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (action === "ban") {
          await prisma.user.update({
            where: { id: targetId },
            data: {
              isBanned: true,
              banReason: reason,
              bannedAt: new Date(),
            },
          });
        } else if (action === "shadow_ban") {
          await prisma.user.update({
            where: { id: targetId },
            data: {
              isShadowBanned: true,
            },
          });
        } else if (action === "unban") {
          await prisma.user.update({
            where: { id: targetId },
            data: {
              isBanned: false,
              isShadowBanned: false,
              banReason: null,
              bannedAt: null,
            },
          });
        } else if (action === "adjust_trust") {
          const adjustment = body.trustAdjustment || 0;
          await prisma.user.update({
            where: { id: targetId },
            data: {
              trustScore: {
                increment: adjustment,
              },
            },
          });
        }
      } else if (targetType === "post") {
        const post = await prisma.communityPost.findUnique({ where: { id: targetId } });
        if (!post) {
          return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        if (action === "hide" || action === "flag") {
          await prisma.communityPost.update({
            where: { id: targetId },
            data: { status: action === "hide" ? "HIDDEN" : "FLAGGED" },
          });
        } else if (action === "delete") {
          await prisma.communityPost.update({
            where: { id: targetId },
            data: { status: "DELETED" },
          });
        }
      }

      // Log the moderation action
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "MODERATION",
          entityType: targetType,
          entityId: targetId,
          details: { action, reason },
        },
      });

      return NextResponse.json({
        success: true,
        message: `${action} action completed on ${targetType}`,
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Moderation action error:", error);
    return NextResponse.json(
      { error: "Failed to perform moderation action" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/moderation - Update report/appeal status
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN" && user?.role !== "MODERATOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { type, id, status, resolution, assignedTo } = body;

    if (type === "report") {
      const report = await prisma.contentReport.update({
        where: { id },
        data: {
          status,
          resolution,
          assignedTo: assignedTo || session.user.id,
          resolvedAt: status === "RESOLVED" || status === "DISMISSED" ? new Date() : null,
        },
      });

      return NextResponse.json({ success: true, report });
    } else if (type === "appeal") {
      const appeal = await prisma.appeal.update({
        where: { id },
        data: {
          status,
          resolution,
          assignedTo: assignedTo || session.user.id,
          resolvedAt: status === "APPROVED" || status === "REJECTED" ? new Date() : null,
        },
      });

      // If appeal approved, reverse the moderation action
      if (status === "APPROVED" && appeal.contentType && appeal.contentId) {
        // Handle reversal based on content type
        if (appeal.contentType === "review") {
          await prisma.review.update({
            where: { id: appeal.contentId },
            data: { status: "PUBLISHED" },
          });
        } else if (appeal.contentType === "account") {
          await prisma.user.update({
            where: { id: appeal.userId },
            data: {
              isBanned: false,
              isShadowBanned: false,
              banReason: null,
            },
          });
        }

        // Notify user
        await prisma.notification.create({
          data: {
            userId: appeal.userId,
            type: "SYSTEM_ANNOUNCEMENT",
            title: "Appeal Approved",
            message: "Your appeal has been reviewed and approved. The action has been reversed.",
            link: `/appeals/${appeal.id}`,
          },
        });
      } else if (status === "REJECTED") {
        // Notify user of rejection
        await prisma.notification.create({
          data: {
            userId: appeal.userId,
            type: "SYSTEM_ANNOUNCEMENT",
            title: "Appeal Decision",
            message: "Your appeal has been reviewed. Unfortunately, the original decision stands.",
            link: `/appeals/${appeal.id}`,
          },
        });
      }

      // Log the decision
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "MODERATION",
          entityType: "Appeal",
          entityId: id,
          details: { status, resolution },
        },
      });

      return NextResponse.json({ success: true, appeal });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Update moderation error:", error);
    return NextResponse.json(
      { error: "Failed to update" },
      { status: 500 }
    );
  }
}
