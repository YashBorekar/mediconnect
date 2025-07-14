import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

interface ChatProps {
  receiverId: string;
  appointmentId?: number;
}

const Chat: React.FC<ChatProps> = ({ receiverId, appointmentId }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const res = await apiRequest(
        `/api/messages?withUser=${receiverId}${
          appointmentId ? `&appointmentId=${appointmentId}` : ""
        }`
      );
      setMessages(await res.json());
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, [receiverId, appointmentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    await apiRequest("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId, appointmentId, content: input }),
    });
    setInput("");
  };

  return (
    <div className="border rounded-lg p-4 bg-white max-w-md w-full">
      <div className="h-64 overflow-y-auto mb-4 flex flex-col gap-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 rounded-lg ${
              msg.isMine
                ? "bg-blue-100 text-right ml-auto"
                : "bg-gray-100 text-left mr-auto"
            }`}
          >
            {msg.content}
            <div className="text-xs text-gray-400 mt-1">
              {new Date(msg.sentAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          className="flex-1 border rounded p-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
};

export default Chat;
