import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/community/posts/:id/comments - Get comments for a post
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = id;

    // Get all comments for this post
    const allComments = await db.postComment.findMany({
      where: { postId },
      include: {
        author: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Build nested comment structure
    const commentMap = new Map();
    const rootComments: any[] = [];

    // First pass: create map of all comments
    allComments.forEach((comment: any) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build tree structure
    allComments.forEach((comment: any) => {
      const commentWithReplies = commentMap.get(comment.id);
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return NextResponse.json({ comments: rootComments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

// POST /api/community/posts/:id/comments - Create a new comment
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let userId: string | null = null;

    if (isMockMode()) {
      // Mock mode: Get user from headers
      userId = req.headers.get("x-user-id");
    } else {
      // Production mode: Get user from NextAuth session
      const session = await auth();
      if (session?.user) {
        userId = session.user.id as string;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const postId = id;
    const body = await req.json();
    const { content, parentId } = body;

    // Validation
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    if (content.length < 1) {
      return NextResponse.json(
        { error: "Comment must be at least 1 character" },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: "Comment must be 1000 characters or less" },
        { status: 400 }
      );
    }

    // Check if post exists
    const posts = await db.communityPost.findMany({
      where: { id: postId },
    });

    if (!posts || posts.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const post = posts[0];

    // If parentId provided, verify it exists and check nesting depth
    if (parentId) {
      const parentComments = await db.postComment.findMany({
        where: { id: parentId },
      });

      if (!parentComments || parentComments.length === 0) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }

      const parentComment = parentComments[0];

      // Check nesting depth (max 3 levels: comment -> reply -> reply)
      if (parentComment.parentId) {
        const grandparentComments = await db.postComment.findMany({
          where: { id: parentComment.parentId },
        });

        if (grandparentComments && grandparentComments.length > 0) {
          const grandparent = grandparentComments[0];
          if (grandparent.parentId) {
            return NextResponse.json(
              { error: "Maximum comment nesting depth (3 levels) exceeded" },
              { status: 400 }
            );
          }
        }
      }
    }

    // Create comment
    const comment = await db.postComment.create({
      data: {
        postId,
        authorId: userId,
        parentId: parentId || null,
        content,
        status: "PUBLISHED",
      },
    });

    // Update post comment count
    await db.communityPost.update({
      where: { id: postId },
      data: { commentCount: post.commentCount + 1 },
    });

    return NextResponse.json({
      message: "Comment created successfully",
      comment,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
