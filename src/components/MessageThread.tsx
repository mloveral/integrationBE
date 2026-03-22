"use client";

import { useState, useRef, useEffect } from "react";
import { Conversation, DirectMessage } from "@/lib/types";
import { CURRENT_USER } from "@/lib/mock-data";
import { formatDistanceToNow } from "@/lib/utils";
import { generateReactHelpers } from "@uploadthing/react";
import { OurFileRouter } from "@/app/api/uploadthing/core";
import { toast } from "sonner";

interface Props {
  initialConversation: Conversation;
}
const { useUploadThing } = generateReactHelpers<OurFileRouter>();

export default function MessageThread({ initialConversation }: Props) {
  const [messages, setMessages] = useState(initialConversation.messages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const {startUpload, isUploading} = useUploadThing(
    "imageUploader",
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaUrl(null);

    const res = await startUpload([file]);
    const uploadedFile = res?.[0];

    if (!uploadedFile?.ufsUrl) {
      console.error("Upload failed. Please try again.");
      return;
    }
    setMediaUrl(uploadedFile.ufsUrl);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending || isUploading) return;

    // Optimistic update — add message locally right away
    const optimistic: DirectMessage = {
      id: `msg_optimistic_${Date.now()}`,
      senderId: CURRENT_USER.id,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      isRead: false,
      mediaUrl: mediaUrl || undefined,
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    setSending(true);
    setMediaUrl(null);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: initialConversation.id,
          text: optimistic.text,
          mediaUrl: optimistic.mediaUrl,
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
      toast.error("No se pudo enviar el mensaje");
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

                {/* visualizacion del media adjunto */}
                {msg.mediaUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={msg.mediaUrl} alt="Attached media" className="mt-2 rounded-lg max-h-60 object-cover" />
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-3 px-4 py-3 border-t border-gray-200">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none"
        />

        {/* file picker */}
        <div
          onClick={() => fileRef.current?.click()}
          className=" aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors overflow-hidden"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-paperclip-icon lucide-paperclip"><path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551"/></svg>
        </div>
        <input
          ref={fileRef}
          onChange={handleFileChange}
          type="file"
          accept={"image/*"}
          className="hidden"
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
