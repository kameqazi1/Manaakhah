"use client";

import { useEffect, useState } from "react";
import { useMockSession } from "@/components/mock-session-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Conversation {
  id: string;
  subject?: string;
  status: string;
  lastMessageAt: Date;
  unreadCount: number;
  business: {
    id: string;
    name: string;
  };
  customer: {
    id: string;
    name: string;
  };
  lastMessage?: {
    content: string;
    createdAt: Date;
  };
}

interface Message {
  id: string;
  content: string;
  createdAt: Date;
  isRead: boolean;
  sender: {
    id: string;
    name: string;
    image?: string;
    role: string;
  };
}

export default function MessagesPage() {
  const { data: session } = useMockSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchConversations();
    }
  }, [session]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch("/api/messages/conversations", {
        headers: {
          "x-user-id": session.user.id,
          "x-user-role": session.user.role,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(
        `/api/messages/conversations/${conversationId}/messages`,
        {
          headers: {
            "x-user-id": session.user.id,
            "x-user-role": session.user.role,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id || !selectedConversation || !newMessage.trim()) return;

    setSending(true);

    try {
      const response = await fetch(
        `/api/messages/conversations/${selectedConversation}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": session.user.id,
            "x-user-role": session.user.role,
          },
          body: JSON.stringify({ content: newMessage }),
        }
      );

      if (response.ok) {
        setNewMessage("");
        fetchMessages(selectedConversation);
        fetchConversations();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const getOtherParty = (conv: Conversation) => {
    if (session?.user?.role === "BUSINESS_OWNER") {
      return conv.customer.name;
    }
    return conv.business.name;
  };

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in</h1>
          <p className="text-gray-600 mb-4">
            You need to be logged in to view your messages
          </p>
          <Link href="/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Messages</h1>
          <p className="text-gray-600">
            Communicate with businesses and customers
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="flex h-[600px]">
              {/* Conversations List */}
              <div className="w-1/3 border-r overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center">Loading...</div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-600 mb-4">No conversations yet</p>
                    <Link href="/search">
                      <Button size="sm">Browse Businesses</Button>
                    </Link>
                  </div>
                ) : (
                  <div>
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv.id)}
                        className={`w-full text-left p-4 border-b hover:bg-gray-50 transition-colors ${
                          selectedConversation === conv.id ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold text-sm">
                            {getOtherParty(conv)}
                          </h3>
                          {conv.unreadCount > 0 && (
                            <Badge variant="default" className="text-xs">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>

                        {conv.subject && (
                          <p className="text-xs text-gray-600 mb-1">
                            {conv.subject}
                          </p>
                        )}

                        {conv.lastMessage && (
                          <p className="text-xs text-gray-600 truncate">
                            {conv.lastMessage.content}
                          </p>
                        )}

                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(conv.lastMessageAt).toLocaleDateString()}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Messages Panel */}
              <div className="flex-1 flex flex-col">
                {!selectedConversation ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    Select a conversation to view messages
                  </div>
                ) : (
                  <>
                    {/* Messages List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          No messages yet
                        </div>
                      ) : (
                        messages.map((message) => {
                          const isOwn = message.sender.id === session.user.id;
                          return (
                            <div
                              key={message.id}
                              className={`flex ${
                                isOwn ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg p-3 ${
                                  isOwn
                                    ? "bg-primary text-white"
                                    : "bg-gray-100 text-gray-900"
                                }`}
                              >
                                {!isOwn && (
                                  <p className="text-xs font-semibold mb-1">
                                    {message.sender.name}
                                  </p>
                                )}
                                <p className="text-sm">{message.content}</p>
                                <p
                                  className={`text-xs mt-1 ${
                                    isOwn ? "text-blue-100" : "text-gray-500"
                                  }`}
                                >
                                  {new Date(message.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="border-t p-4">
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          maxLength={2000}
                          disabled={sending}
                        />
                        <Button type="submit" disabled={sending || !newMessage.trim()}>
                          {sending ? "Sending..." : "Send"}
                        </Button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
