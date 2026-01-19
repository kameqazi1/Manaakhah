"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useMockSession } from "@/components/mock-session-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface Conversation {
  id: string;
  subject?: string;
  status: string;
  lastMessageAt: string;
  unreadCount: number;
  participants: string[];
  participantNames: { [key: string]: string };
  business?: {
    id: string;
    name: string;
  };
  customer?: {
    id: string;
    name: string;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
  };
}

interface Message {
  id: string;
  conversationId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  senderId: string;
  sender: {
    id: string;
    name: string;
    image?: string;
    role: string;
  };
}

function MessagesContent() {
  const { data: session } = useMockSession();
  const searchParams = useSearchParams();
  const toUserId = searchParams.get("to");
  const businessId = searchParams.get("business");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.user?.id) {
      loadConversations();
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (toUserId && session?.user?.id) {
      startOrOpenConversation(toUserId, businessId || undefined);
    }
  }, [toUserId, businessId, session?.user?.id]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = () => {
    // Try API first, fall back to localStorage
    fetchConversationsFromAPI().then(apiConvs => {
      if (apiConvs && apiConvs.length > 0) {
        setConversations(apiConvs);
      } else {
        // Load from localStorage
        const saved = localStorage.getItem("conversations");
        if (saved) {
          try {
            const all: Conversation[] = JSON.parse(saved);
            const userConvs = all.filter(c =>
              c.participants?.includes(session?.user?.id || "") ||
              c.customer?.id === session?.user?.id ||
              c.business?.id === session?.user?.id
            );
            setConversations(userConvs.sort((a, b) =>
              new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
            ));
          } catch {
            setConversations([]);
          }
        }
      }
      setLoading(false);
    });
  };

  const fetchConversationsFromAPI = async (): Promise<Conversation[] | null> => {
    if (!session?.user?.id) return null;
    try {
      const response = await fetch("/api/messages/conversations", {
        headers: {
          "x-user-id": session.user.id,
          "x-user-role": session.user.role,
        },
      });
      if (response.ok) {
        const data = await response.json();
        return data.conversations;
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
    return null;
  };

  const startOrOpenConversation = (otherUserId: string, businessId?: string) => {
    const saved = localStorage.getItem("conversations");
    let all: Conversation[] = saved ? JSON.parse(saved) : [];

    // Check if conversation exists
    let existing = all.find(c =>
      c.participants?.includes(session?.user?.id || "") &&
      c.participants?.includes(otherUserId)
    );

    if (!existing) {
      // Create new conversation
      const newConv: Conversation = {
        id: `conv_${Date.now()}`,
        status: "active",
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
        participants: [session?.user?.id || "", otherUserId],
        participantNames: {
          [session?.user?.id || ""]: session?.user?.name || "You",
          [otherUserId]: "User",
        },
        business: businessId ? { id: businessId, name: "Business" } : undefined,
        customer: { id: session?.user?.id || "", name: session?.user?.name || "You" },
      };
      all.push(newConv);
      localStorage.setItem("conversations", JSON.stringify(all));
      existing = newConv;
    }

    setConversations(all.filter(c =>
      c.participants?.includes(session?.user?.id || "") ||
      c.customer?.id === session?.user?.id
    ));
    setSelectedConversation(existing.id);
  };

  const loadMessages = (conversationId: string) => {
    // Try API first
    fetchMessagesFromAPI(conversationId).then(apiMsgs => {
      if (apiMsgs && apiMsgs.length > 0) {
        setMessages(apiMsgs);
      } else {
        // Load from localStorage
        const saved = localStorage.getItem("messages");
        if (saved) {
          try {
            const all: Message[] = JSON.parse(saved);
            const convMsgs = all
              .filter(m => m.conversationId === conversationId)
              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            setMessages(convMsgs);
          } catch {
            setMessages([]);
          }
        } else {
          setMessages([]);
        }
      }
      markAsRead(conversationId);
    });
  };

  const fetchMessagesFromAPI = async (conversationId: string): Promise<Message[] | null> => {
    if (!session?.user?.id) return null;
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
        return data.messages;
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
    return null;
  };

  const markAsRead = (conversationId: string) => {
    // Update messages
    const savedMsgs = localStorage.getItem("messages");
    if (savedMsgs) {
      const allMsgs: Message[] = JSON.parse(savedMsgs);
      const updated = allMsgs.map(m =>
        m.conversationId === conversationId && m.senderId !== session?.user?.id
          ? { ...m, isRead: true }
          : m
      );
      localStorage.setItem("messages", JSON.stringify(updated));
    }

    // Update conversation unread count
    const savedConvs = localStorage.getItem("conversations");
    if (savedConvs) {
      const allConvs: Conversation[] = JSON.parse(savedConvs);
      const updated = allConvs.map(c =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      );
      localStorage.setItem("conversations", JSON.stringify(updated));
      setConversations(updated.filter(c =>
        c.participants?.includes(session?.user?.id || "") ||
        c.customer?.id === session?.user?.id
      ));
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id || !selectedConversation || !newMessage.trim()) return;

    setSending(true);

    const conv = conversations.find(c => c.id === selectedConversation);
    const otherUserId = conv?.participants?.find(p => p !== session.user.id) ||
                        (conv?.business?.id !== session.user.id ? conv?.business?.id : conv?.customer?.id) || "";

    const message: Message = {
      id: `msg_${Date.now()}`,
      conversationId: selectedConversation,
      content: newMessage.trim(),
      createdAt: new Date().toISOString(),
      isRead: false,
      senderId: session.user.id,
      sender: {
        id: session.user.id,
        name: session.user.name || "You",
        role: session.user.role,
      },
    };

    // Try API first
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
        loadMessages(selectedConversation);
        loadConversations();
        setSending(false);
        return;
      }
    } catch (error) {
      console.error("API error, falling back to localStorage:", error);
    }

    // Fallback to localStorage
    const savedMsgs = localStorage.getItem("messages");
    const allMsgs: Message[] = savedMsgs ? JSON.parse(savedMsgs) : [];
    allMsgs.push(message);
    localStorage.setItem("messages", JSON.stringify(allMsgs));

    // Update conversation
    const savedConvs = localStorage.getItem("conversations");
    const allConvs: Conversation[] = savedConvs ? JSON.parse(savedConvs) : [];
    const updatedConvs = allConvs.map(c =>
      c.id === selectedConversation
        ? {
            ...c,
            lastMessage: { content: newMessage.trim(), createdAt: new Date().toISOString() },
            lastMessageAt: new Date().toISOString(),
          }
        : c
    );
    localStorage.setItem("conversations", JSON.stringify(updatedConvs));

    setMessages([...messages, message]);
    setConversations(updatedConvs.filter(c =>
      c.participants?.includes(session.user.id) ||
      c.customer?.id === session.user.id
    ).sort((a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    ));
    setNewMessage("");
    setSending(false);
  };

  const getOtherParty = (conv: Conversation) => {
    if (conv.participantNames) {
      const otherId = conv.participants?.find(p => p !== session?.user?.id);
      if (otherId && conv.participantNames[otherId]) {
        return conv.participantNames[otherId];
      }
    }
    if (session?.user?.role === "BUSINESS_OWNER") {
      return conv.customer?.name || "Customer";
    }
    return conv.business?.name || "Business";
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true;
    const name = getOtherParty(c).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in</h1>
          <p className="text-gray-600 mb-4">You need to be logged in to view your messages</p>
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
          <p className="text-gray-600">Communicate with businesses and customers</p>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="flex h-[600px]">
              {/* Conversations List */}
              <div className="w-1/3 border-r flex flex-col">
                <div className="p-3 border-b">
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-center">Loading...</div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-gray-600 mb-4">
                        {searchQuery ? "No conversations found" : "No conversations yet"}
                      </p>
                      {!searchQuery && (
                        <Link href="/search">
                          <Button size="sm">Browse Businesses</Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv.id)}
                        className={`w-full text-left p-4 border-b hover:bg-gray-50 transition-colors ${
                          selectedConversation === conv.id ? "bg-green-50" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold flex-shrink-0">
                            {getOtherParty(conv).charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-sm truncate">
                                {getOtherParty(conv)}
                              </h3>
                              <span className="text-xs text-gray-500 flex-shrink-0">
                                {formatTime(conv.lastMessageAt)}
                              </span>
                            </div>
                            {conv.subject && (
                              <p className="text-xs text-green-600 mb-1 truncate">{conv.subject}</p>
                            )}
                            {conv.lastMessage && (
                              <p className="text-xs text-gray-600 truncate">{conv.lastMessage.content}</p>
                            )}
                          </div>
                          {conv.unreadCount > 0 && (
                            <Badge variant="default" className="bg-green-600 flex-shrink-0">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Messages Panel */}
              <div className="flex-1 flex flex-col">
                {!selectedConversation ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <span className="text-4xl block mb-4">💬</span>
                      <p>Select a conversation to view messages</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="p-4 border-b flex items-center gap-3">
                      {(() => {
                        const conv = conversations.find(c => c.id === selectedConversation);
                        if (!conv) return null;
                        return (
                          <>
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold">
                              {getOtherParty(conv).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-semibold">{getOtherParty(conv)}</h3>
                              {conv.business?.name && conv.business.id !== session?.user?.id && (
                                <Link href={`/business/${conv.business.id}`} className="text-xs text-green-600 hover:underline">
                                  View Business
                                </Link>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Messages List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          No messages yet. Start the conversation!
                        </div>
                      ) : (
                        messages.map((message) => {
                          const isOwn = message.senderId === session.user.id || message.sender.id === session.user.id;
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg p-3 ${
                                  isOwn
                                    ? "bg-green-600 text-white"
                                    : "bg-gray-100 text-gray-900"
                                }`}
                              >
                                {!isOwn && (
                                  <p className="text-xs font-semibold mb-1">{message.sender.name}</p>
                                )}
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                <p className={`text-xs mt-1 ${isOwn ? "text-green-100" : "text-gray-500"}`}>
                                  {formatTime(message.createdAt)}
                                  {isOwn && <span className="ml-2">{message.isRead ? "✓✓" : "✓"}</span>}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="border-t p-4">
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          maxLength={2000}
                          disabled={sending}
                          className="flex-1"
                        />
                        <Button type="submit" disabled={sending || !newMessage.trim()}>
                          {sending ? "..." : "Send"}
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

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading messages...</p>
        </div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
