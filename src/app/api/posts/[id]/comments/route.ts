import { NextRequest, NextResponse } from "next/server";
import { MOCK_POSTS } from "@/lib/mock-data";
import { Comment } from "@/lib/types";
import { CURRENT_USER } from "@/lib/mock-data";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body: { comment?: string } = await _req.json();
  const { comment } = body;

  if (!comment?.trim()) {
    return NextResponse.json(
      { error: "Comment text is required" },
      { status: 400 }
    );
  }

  const post = MOCK_POSTS.find((p) => p.id === id);

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (!post.comments) {
    post.comments = [];
  }

  const newComment = {
      id: `${Date.now()}${CURRENT_USER.id}`,
      author: CURRENT_USER,
      text: comment.trim(),
      createdAt: new Date(Date.now() - 600_000).toISOString(),
      likesCount: 0,
    } as Comment;

    post.comments.push(newComment)
    post.commentsCount = (post.commentsCount || 0) + 1;

  return NextResponse.json({ comments: post.comments });
}