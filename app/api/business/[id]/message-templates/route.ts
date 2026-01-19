import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const templateSchema = z.object({
  name: z.string().min(1).max(100),
  content: z.string().min(1).max(2000),
  category: z.enum([
    "greeting",
    "booking_confirmation",
    "booking_reminder",
    "booking_cancellation",
    "thank_you",
    "follow_up",
    "promotion",
    "custom",
  ]),
  variables: z.array(z.string()).optional(),
});

// GET /api/business/[id]/message-templates - Get message templates
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: businessId } = await params;

    // Check permission
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const isOwner = business.ownerId === session.user.id;
    const staffRole = await prisma.staffRole.findUnique({
      where: {
        businessId_userId: {
          businessId,
          userId: session.user.id,
        },
      },
    });

    const canManageMessages =
      isOwner || (staffRole?.permissions as any)?.canManageMessages;

    if (!canManageMessages) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const templates = await prisma.messageTemplate.findMany({
      where: { businessId },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Get templates error:", error);
    return NextResponse.json(
      { error: "Failed to get templates" },
      { status: 500 }
    );
  }
}

// POST /api/business/[id]/message-templates - Create a template
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

    const validationResult = templateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    // Check permission
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const isOwner = business.ownerId === session.user.id;
    const staffRole = await prisma.staffRole.findUnique({
      where: {
        businessId_userId: {
          businessId,
          userId: session.user.id,
        },
      },
    });

    const canManageMessages =
      isOwner || (staffRole?.permissions as any)?.canManageMessages;

    if (!canManageMessages) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Extract variables from content (e.g., {customerName}, {businessName})
    const variableRegex = /\{([^}]+)\}/g;
    const extractedVariables: string[] = [];
    let match;
    while ((match = variableRegex.exec(validationResult.data.content)) !== null) {
      if (!extractedVariables.includes(match[1])) {
        extractedVariables.push(match[1]);
      }
    }

    const template = await prisma.messageTemplate.create({
      data: {
        businessId,
        name: validationResult.data.name,
        content: validationResult.data.content,
        category: validationResult.data.category,
        variables: validationResult.data.variables || extractedVariables,
      },
    });

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error("Create template error:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}

// PUT /api/business/[id]/message-templates - Update a template
export async function PUT(
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
    const { templateId, ...data } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    // Check permission
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const isOwner = business.ownerId === session.user.id;
    const staffRole = await prisma.staffRole.findUnique({
      where: {
        businessId_userId: {
          businessId,
          userId: session.user.id,
        },
      },
    });

    const canManageMessages =
      isOwner || (staffRole?.permissions as any)?.canManageMessages;

    if (!canManageMessages) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Extract variables if content changed
    let variables = data.variables;
    if (data.content && !variables) {
      const variableRegex = /\{([^}]+)\}/g;
      variables = [];
      let match;
      while ((match = variableRegex.exec(data.content)) !== null) {
        if (!variables.includes(match[1])) {
          variables.push(match[1]);
        }
      }
    }

    const template = await prisma.messageTemplate.update({
      where: { id: templateId },
      data: {
        name: data.name,
        content: data.content,
        category: data.category,
        variables: variables,
      },
    });

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error("Update template error:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE /api/business/[id]/message-templates - Delete a template
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
    const templateId = searchParams.get("id");

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    // Check permission
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const isOwner = business.ownerId === session.user.id;
    const staffRole = await prisma.staffRole.findUnique({
      where: {
        businessId_userId: {
          businessId,
          userId: session.user.id,
        },
      },
    });

    const canManageMessages =
      isOwner || (staffRole?.permissions as any)?.canManageMessages;

    if (!canManageMessages) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.messageTemplate.delete({
      where: { id: templateId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete template error:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}

/**
 * Helper function to render a template with variables
 */
export function renderTemplate(
  content: string,
  variables: Record<string, string>
): string {
  return content.replace(/\{([^}]+)\}/g, (match, key) => {
    return variables[key] || match;
  });
}
