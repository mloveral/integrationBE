import { NextRequest, NextResponse } from "next/server";
import { MOCK_USERS, CURRENT_USER } from "@/lib/mock-data";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  // Busca el usuario a seguir
  const userToFollow = MOCK_USERS.find((u) => u.username === username);

  if (!userToFollow) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Aumenta followers del usuario
  userToFollow.followersCount += 1;
  
  // Aumenta following del usuario actual
  CURRENT_USER.followingCount += 1;

  return NextResponse.json({ user: userToFollow });
}