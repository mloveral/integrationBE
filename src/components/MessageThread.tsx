"use client";

import { useState, useRef, useEffect } from "react";
import { Conversation, DirectMessage } from "@/lib/types";
import { CURRENT_USER } from "@/lib/mock-data";
import { formatDistanceToNow } from "@/lib/utils";

interface Props {
  initialConversation: Conversation;
}

export default function MessageThread({ initialConversation }: Props) {
  const [messages, setMessages] = useState(initialConversation.messages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;

    // Optimistic update — add message locally right away
    const optimistic: DirectMessage = {
      id: `msg_optimistic_${Date.now()}`,
      senderId: CURRENT_USER.id,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    setSending(true);
    
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: initialConversation.id,
          text: optimistic.text,
        })
      })

      if (!res.ok) {
        throw new Error("Failed to send message");
      }
      const updatedConversation: Conversation = await res.json();

      // Replace optimistic message with the one from the server (which has the real ID)
      setMessages(updatedConversation.messages);
    } catch {
      // On error, remove the optimistic message
      setMessages((prev) => prev.filter((msg) => msg.id !== optimistic.id));
    }

    setSending(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={initialConversation.participant.avatar}
          alt={initialConversation.participant.username}
          className="w-9 h-9 rounded-full object-cover"
        />
        <div>
          <p className="font-semibold text-sm">{initialConversation.participant.username}</p>
          <p className="text-xs text-gray-400">{initialConversation.participant.name}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        {messages.map((msg) => {
          const isMe = msg.senderId === CURRENT_USER.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${isMe
                    ? "bg-blue-500 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-900 rounded-bl-sm"
                  }`}
              >
                <p>{msg.text}</p>
                <p className={`text-xs mt-1 ${isMe ? "text-blue-100" : "text-gray-400"}`}>
                  {formatDistanceToNow(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-3 px-4 py-3 border-t border-gray-200">
        {/* TODO: Add a file picker here for media messages.
            After picking a file, upload it with UploadThing and pass the returned URL
            as `mediaUrl` in the fetch body above. */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="text-sm font-semibold text-blue-500 disabled:opacity-40"
        >
          {sending ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
