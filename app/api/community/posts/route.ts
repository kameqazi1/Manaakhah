import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";

// GET /api/community/posts - Get community posts
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const postType = searchParams.get("postType");
    const authorId = searchParams.get("authorId");
    const businessId = searchParams.get("businessId");
    const sortBy = searchParams.get("sortBy") || "newest";

    const where: any = {};

    if (status) where.status = status;
    if (postType) where.postType = postType;
    if (authorId) where.authorId = authorId;
    if (businessId) where.businessId = businessId;

    const orderBy: any = {};
    if (sortBy === "newest") orderBy.publishedAt = "desc";
    if (sortBy === "oldest") orderBy.publishedAt = "asc";
    if (sortBy === "popular") orderBy.likeCount = "desc";
    if (sortBy === "discussed") orderBy.commentCount = "desc";

    const posts = await db.communityPost.findMany({
      where,
      include: {
        author: true,
        business: true,
      },
      orderBy,
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

// POST /api/community/posts - Create a new post
export async function POST(req: Request) {
  try {
    let userId: string | null = null;
    let userRole: string | null = null;

    if (isMockMode()) {
      userId = req.headers.get("x-user-id");
      userRole = req.headers.get("x-user-role");
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      content,
      postType,
      businessId,
      tags,
      attachments,
      isPinned,
    } = body;

    // Validation
    if (!title || !content || !postType) {
      return NextResponse.json(
        { error: "title, content, and postType are required" },
        { status: 400 }
      );
    }

    if (title.length < 5) {
      return NextResponse.json(
        { error: "Title must be at least 5 characters" },
        { status: 400 }
      );
    }

    if (content.length < 20) {
      return NextResponse.json(
        { error: "Content must be at least 20 characters" },
        { status: 400 }
      );
    }

    const validPostTypes = [
      "ANNOUNCEMENT",
      "EVENT",
      "RESOURCE",
      "QUESTION",
      "DISCUSSION",
      "PROMOTION",
    ];
    if (!validPostTypes.includes(postType)) {
      return NextResponse.json({ error: "Invalid post type" }, { status: 400 });
    }

    // Only admins and business owners can pin posts
    if (isPinned && userRole !== "ADMIN") {
      // Check if user owns the business
      if (businessId) {
        const business = await db.business.findUnique({
          where: { id: businessId },
        });

        if (!business || business.ownerId !== userId) {
          return NextResponse.json(
            { error: "Only business owners and admins can pin posts" },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Only admins can pin non-business posts" },
          { status: 403 }
        );
      }
    }

    // If businessId provided, verify ownership (for PROMOTION posts)
    if (businessId && postType === "PROMOTION") {
      const business = await db.business.findUnique({
        where: { id: businessId },
      });

      if (!business || business.ownerId !== userId) {
        return NextResponse.json(
          { error: "You can only create promotions for your own business" },
          { status: 403 }
        );
      }
    }

    // Create post
    const post = await db.communityPost.create({
      data: {
        authorId: userId,
        businessId: businessId || null,
        title,
        content,
        postType,
        tags: tags || [],
        attachments: attachments || [],
        isPinned: isPinned || false,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
