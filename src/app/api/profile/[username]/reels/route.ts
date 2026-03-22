import { MOCK_REELS } from "@/lib/mock-data";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
    const { username } = await params;

    const userReels = MOCK_REELS.filter((reel) => reel.author.username === username);

  return NextResponse.json(userReels);
}