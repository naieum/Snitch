"use client";

import { useState, useEffect } from "react";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender?: { name: string };
  receiver?: { name: string };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [receiverId, setReceiverId] = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (userId) {
      fetch(`/api/chat?userId=${userId}`)
        .then((r) => r.json())
        .then((data) => setMessages(data.messages || []))
        .catch(() => {});
    }
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const senderId = localStorage.getItem("user_id") || "demo";
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId, receiverId, content: newMessage }),
      });
      setNewMessage("");
      // Refresh messages
      const res = await fetch(`/api/chat?userId=${senderId}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      // Silently fail
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Messages</h1>
      <div className="bg-white rounded-xl border border-gray-200 flex flex-col" style={{ height: "60vh" }}>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-sm">No messages yet.</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span className="font-medium">{msg.sender?.name || "Unknown"}</span>
                  <span>{new Date(msg.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm">{msg.content}</p>
              </div>
            ))
          )}
        </div>
        <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              placeholder="Recipient ID"
              className="w-40 px-3 py-2 text-sm border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
