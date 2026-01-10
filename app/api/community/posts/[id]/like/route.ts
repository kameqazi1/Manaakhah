import { NextResponse } from "next/server";
import { db, isMockMode } from "@/lib/db";

// POST /api/community/posts/:id/like - Toggle like on a post
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    let userId: string | null = null;

    if (isMockMode()) {
      userId = req.headers.get("x-user-id");
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const postId = params.id;

    // Check if post exists
    const posts = await db.communityPost.findMany({
      where: { id: postId },
    });

    if (!posts || posts.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const post = posts[0];

    // In mock mode, we'll just increment/decrement the like count
    // In real DB, we'd use PostLike table to track unique likes
    const body = await req.json();
    const { isLiked } = body;

    const newLikeCount = isLiked ? post.likeCount + 1 : Math.max(0, post.likeCount - 1);

    const updatedPost = await db.communityPost.update({
      where: { id: postId },
      data: { likeCount: newLikeCount },
    });

    return NextResponse.json({
      message: isLiked ? "Post liked" : "Post unliked",
      likeCount: updatedPost.likeCount,
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}
