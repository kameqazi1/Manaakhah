import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const questionSchema = z.object({
  question: z.string().min(10).max(1000),
  isAnonymous: z.boolean().optional(),
});

const answerSchema = z.object({
  questionId: z.string(),
  answer: z.string().min(1).max(2000),
});

// GET /api/business/[id]/questions - Get business Q&A
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const status = searchParams.get("status"); // open, answered, all

    const where: any = { businessId };
    if (status && status !== "all") {
      where.status = status;
    }

    const [questions, total] = await Promise.all([
      prisma.businessQuestion.findMany({
        where,
        include: {
          answers: {
            orderBy: [
              { isOfficial: "desc" },
              { upvotes: "desc" },
              { createdAt: "asc" },
            ],
          },
        },
        orderBy: [
          { upvotes: "desc" },
          { createdAt: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.businessQuestion.count({ where }),
    ]);

    return NextResponse.json({
      questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get questions error:", error);
    return NextResponse.json(
      { error: "Failed to get questions" },
      { status: 500 }
    );
  }
}

// POST /api/business/[id]/questions - Ask a question or answer
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: businessId } = await params;
    const body = await req.json();
    const { type } = body; // "question" or "answer"

    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, ownerId: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (type === "question") {
      const validationResult = questionSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Invalid input", details: validationResult.error.issues },
          { status: 400 }
        );
      }

      const question = await prisma.businessQuestion.create({
        data: {
          businessId,
          askerId: session.user.id,
          question: validationResult.data.question,
          isAnonymous: validationResult.data.isAnonymous ?? false,
        },
        include: {
          answers: true,
        },
      });

      // Notify business owner
      await prisma.notification.create({
        data: {
          userId: business.ownerId,
          type: "POST_COMMENT", // Using existing type for Q&A
          title: "New Question",
          message: `Someone asked a question about your business: "${validationResult.data.question.slice(0, 50)}..."`,
          link: `/business/${businessId}?tab=questions`,
          data: { questionId: question.id },
        },
      });

      return NextResponse.json({ success: true, question });
    } else if (type === "answer") {
      const validationResult = answerSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Invalid input", details: validationResult.error.issues },
          { status: 400 }
        );
      }

      // Verify question exists and belongs to this business
      const question = await prisma.businessQuestion.findFirst({
        where: {
          id: validationResult.data.questionId,
          businessId,
        },
      });

      if (!question) {
        return NextResponse.json(
          { error: "Question not found" },
          { status: 404 }
        );
      }

      // Check if this is an official answer from business owner/staff
      const isOwner = business.ownerId === session.user.id;
      const staffRole = await prisma.staffRole.findUnique({
        where: {
          businessId_userId: {
            businessId,
            userId: session.user.id,
          },
        },
      });
      const isOfficial = isOwner || !!staffRole;

      const answer = await prisma.businessAnswer.create({
        data: {
          questionId: validationResult.data.questionId,
          answererId: session.user.id,
          answer: validationResult.data.answer,
          isOfficial,
        },
      });

      // Update question status if answered officially
      if (isOfficial) {
        await prisma.businessQuestion.update({
          where: { id: question.id },
          data: { status: "answered" },
        });
      }

      // Notify question asker
      if (question.askerId && question.askerId !== session.user.id) {
        await prisma.notification.create({
          data: {
            userId: question.askerId,
            type: "POST_COMMENT",
            title: isOfficial ? "Official Answer" : "New Answer",
            message: `Your question received ${isOfficial ? "an official" : "a"} response`,
            link: `/business/${businessId}?tab=questions`,
            data: { questionId: question.id, answerId: answer.id },
          },
        });
      }

      return NextResponse.json({ success: true, answer });
    }

    return NextResponse.json(
      { error: "Type must be 'question' or 'answer'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Create Q&A error:", error);
    return NextResponse.json(
      { error: "Failed to create question/answer" },
      { status: 500 }
    );
  }
}

// PUT /api/business/[id]/questions - Upvote question or answer
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, id, action } = body; // type: question/answer, action: upvote

    if (action === "upvote") {
      if (type === "question") {
        const question = await prisma.businessQuestion.update({
          where: { id },
          data: { upvotes: { increment: 1 } },
        });
        return NextResponse.json({ success: true, upvotes: question.upvotes });
      } else if (type === "answer") {
        const answer = await prisma.businessAnswer.update({
          where: { id },
          data: { upvotes: { increment: 1 } },
        });
        return NextResponse.json({ success: true, upvotes: answer.upvotes });
      }
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Update Q&A error:", error);
    return NextResponse.json(
      { error: "Failed to update" },
      { status: 500 }
    );
  }
}

// DELETE /api/business/[id]/questions - Delete question or answer
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: businessId } = await params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json(
        { error: "Type and ID are required" },
        { status: 400 }
      );
    }

    // Check permissions
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const isOwner = business.ownerId === session.user.id;
    const isAdmin = (session.user as any).role === "ADMIN";

    if (type === "question") {
      const question = await prisma.businessQuestion.findUnique({
        where: { id },
      });

      if (!question) {
        return NextResponse.json(
          { error: "Question not found" },
          { status: 404 }
        );
      }

      // Only question asker, business owner, or admin can delete
      const canDelete =
        question.askerId === session.user.id || isOwner || isAdmin;

      if (!canDelete) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      await prisma.businessQuestion.delete({ where: { id } });
    } else if (type === "answer") {
      const answer = await prisma.businessAnswer.findUnique({
        where: { id },
      });

      if (!answer) {
        return NextResponse.json(
          { error: "Answer not found" },
          { status: 404 }
        );
      }

      // Only answerer, business owner, or admin can delete
      const canDelete =
        answer.answererId === session.user.id || isOwner || isAdmin;

      if (!canDelete) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      await prisma.businessAnswer.delete({ where: { id } });
    } else {
      return NextResponse.json(
        { error: "Type must be 'question' or 'answer'" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Q&A error:", error);
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }
}
