import { NextRequest, NextResponse } from "next/server";
import { MOCK_CONVERSATIONS, CURRENT_USER } from "@/lib/mock-data";
import { SendMessagePayload } from "@/lib/types";

export async function GET() {
  return NextResponse.json(MOCK_CONVERSATIONS);
}

export async function POST(req: NextRequest) {
  const body: SendMessagePayload = await req.json();

  if (!body.conversationId || !body.text) {
    return NextResponse.json(
      { error: "conversationId and text are required" },
      { status: 400 }
    );
  }

  const conversation = MOCK_CONVERSATIONS.find((c) => c.id === body.conversationId);

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  console.log("url", body.mediaUrl);

  const newMessage = {
    id: `msg_${Date.now()}`,
    senderId: CURRENT_USER.id,
    text: body.text,
    mediaUrl: body.mediaUrl,
    createdAt: new Date().toISOString(),
    isRead: false,
  };

  conversation.messages.push(newMessage);
  conversation.lastMessage = newMessage;

  return NextResponse.json(conversation, { status: 201 });
}
