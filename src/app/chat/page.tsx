"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Send,
  MessageSquare,
  User,
  Clock,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Building,
  Sparkles,
  Smile,
  Check,
  CheckCheck,
  Paperclip,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/providers/ToastProvider";

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const toast = useToast();

  // Selected partner
  const recipientId = searchParams.get("recipientId") || "";

  // Chat text state
  const [typedMessage, setTypedMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll conversations every 3s
  const { data: conversationsData, isLoading: isConversationsLoading, refetch: refetchConversations } =
    trpc.chat.listConversations.useQuery(undefined, {
      refetchInterval: 3000,
      enabled: !!session?.user,
    });

  // Poll conversation history every 3s
  const { data: conversationHistory, isLoading: isMessagesLoading, refetch: refetchHistory } =
    trpc.chat.getConversation.useQuery(
      { recipientId },
      {
        enabled: !!recipientId && !!session?.user,
        refetchInterval: 3000,
      }
    );

  const sendMessageMutation = trpc.chat.sendMessage.useMutation();
  const markReadMutation = trpc.chat.markRead.useMutation();

  const conversations = conversationsData?.conversations || [];
  const messages = conversationHistory?.messages || [];

  // Mark messages as read when opening a conversation
  useEffect(() => {
    if (recipientId && session?.user) {
      markReadMutation.mutate({ senderId: recipientId }, {
        onSuccess: () => {
          refetchConversations();
        }
      });
    }
  }, [recipientId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activePartner = conversations.find((c) => c.user.id === recipientId)?.user;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !recipientId) return;

    const messageText = typedMessage.trim();
    setTypedMessage("");
    setShowEmoji(false);

    try {
      await sendMessageMutation.mutateAsync({
        recipientId,
        content: messageText,
      });
      refetchHistory();
      refetchConversations();
    } catch (err: any) {
      console.error("Failed to send message:", err);
      // Restore input text so the user doesn't lose their draft
      setTypedMessage(messageText);
      toast.error(err.message || "Failed to send message.");
    }
  };

  // Emoji picker data
  const EMOJI_LIST = [
    "😊", "👍", "🙏", "❤️", "😂", "🎉", "👋", "✅",
    "🙂", "😍", "🤔", "💪", "🔥", "⭐", "💯", "🤝",
    "😄", "🥰", "😎", "🤗", "👏", "✨", "💡", "📞",
  ];

  const insertEmoji = (emoji: string) => {
    setTypedMessage((prev) => prev + emoji);
  };

  const formatMessageTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateSeparator = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const shouldShowDateSeparator = (currentMsg: typeof messages[0], prevMsg: typeof messages[0] | undefined) => {
    if (!prevMsg) return true;
    const curr = new Date(currentMsg.createdAt).toDateString();
    const prev = new Date(prevMsg.createdAt).toDateString();
    return curr !== prev;
  };

  return (
    <div className="min-h-screen bg-surface-primary text-text-primary flex" style={{ paddingTop: 'var(--app-nav-height)' }}>
      <div className="w-full max-w-6xl mx-auto flex h-[calc(100vh-4rem)] border border-white/5 bg-surface-secondary/20 backdrop-blur-md overflow-hidden rounded-2xl my-4">
        
        {/* Left Side: Conversations List */}
        <div
          className={cn(
            "w-full md:w-80 border-r border-white/5 flex flex-col h-full bg-surface-tertiary/30 shrink-0",
            recipientId ? "hidden md:flex" : "flex"
          )}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-base font-extrabold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-brand-primary" />
              <span>Inbox Messages</span>
            </h2>
            <span className="text-[10px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full font-bold select-none flex items-center gap-1">
              <Clock className="h-2.5 w-2.5 animate-pulse" />
              <span>Live Polling</span>
            </span>
          </div>

          {/* List content */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isConversationsLoading ? (
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 w-full rounded-xl animate-shimmer bg-gradient-to-r from-surface-secondary to-surface-tertiary opacity-60"
                />
              ))
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-2">
                <MessageSquare className="h-8 w-8 text-text-muted mx-auto opacity-50" />
                <p className="text-xs text-text-muted">No conversations yet.</p>
                <p className="text-[10px] text-text-muted/70 leading-relaxed">
                  Start an appointment or chat via the Local Vendor Directory page.
                </p>
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = c.user.id === recipientId;
                const isVendor = c.user.role === "VENDOR";

                return (
                  <button
                    key={c.user.id}
                    onClick={() => router.push(`/chat?recipientId=${c.user.id}`)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl transition-all flex items-start justify-between gap-3 relative select-none group",
                      isSelected
                        ? "bg-brand-primary/10 border border-brand-primary/20 text-brand-primary"
                        : "hover:bg-white/5 border border-transparent text-text-secondary"
                    )}
                  >
                    <div className="flex gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-surface-secondary border border-white/10 flex items-center justify-center text-text-muted shrink-0">
                        {isVendor ? (
                          <Building className="h-4 w-4 text-brand-accent" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold truncate block">
                            {c.user.businessName || c.user.name}
                          </span>
                          {isVendor && (
                            <ShieldCheck className="h-3 w-3 text-verified-blue shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-text-muted truncate mt-0.5">
                          {c.lastMessage.content}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-[9px] text-text-muted flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5 opacity-65" />
                        <span>
                          {new Date(c.lastMessage.createdAt).toLocaleTimeString("en-IN", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        {c.unreadCount > 0 && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[8px] font-bold text-white">
                            {c.unreadCount > 9 ? '9+' : c.unreadCount}
                          </span>
                        )}
                        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all text-text-muted" />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Chat Panel */}
        <div
          className={cn(
            "flex-1 flex flex-col h-full bg-surface-primary/25 relative",
            !recipientId ? "hidden md:flex items-center justify-center text-center p-8" : "flex"
          )}
        >
          {recipientId ? (
            <>
              {/* Partner info top bar */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-surface-tertiary/20">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push("/chat")}
                    className="md:hidden p-1 hover:bg-white/5 rounded-lg text-text-secondary"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="h-9 w-9 rounded-full bg-surface-secondary border border-white/10 flex items-center justify-center text-text-muted shrink-0">
                    {activePartner?.role === "VENDOR" ? (
                      <Building className="h-4.5 w-4.5 text-brand-accent" />
                    ) : (
                      <User className="h-4.5 w-4.5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                      <span>{activePartner?.businessName || activePartner?.name || "Loading..."}</span>
                      {activePartner?.role === "VENDOR" && (
                        <ShieldCheck className="h-3.5 w-3.5 text-verified-blue" />
                      )}
                    </h3>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      {activePartner?.role === "VENDOR" ? "Local Vendor Partner" : "Neighborhood Resident"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-success animate-ping"></span>
                  <span className="text-[10px] text-success font-semibold uppercase tracking-wider">
                    Online
                  </span>
                </div>
              </div>

              {/* Message thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {isMessagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <span className="animate-spin h-6 w-6 border-2 border-brand-primary border-t-transparent rounded-full" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-center space-y-3.5">
                    <div className="rounded-2xl bg-brand-primary/5 p-4 border border-brand-primary/10 text-brand-primary animate-bounce">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-text-primary">Say Hello!</h4>
                      <p className="text-[10px] text-text-muted mt-1 max-w-xs leading-relaxed">
                        Send a message to kick off your hyper-local neighborhood request. Keep details safe and transparent.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isMe = m.senderId === session?.user?.id;
                    const showDateSep = shouldShowDateSeparator(m, messages[idx - 1]);

                    return (
                      <div key={m.id}>
                        {showDateSep && (
                          <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px bg-white/5" />
                            <span className="text-[10px] font-bold text-text-muted bg-surface-secondary/50 px-3 py-1 rounded-full">
                              {formatDateSeparator(m.createdAt)}
                            </span>
                            <div className="flex-1 h-px bg-white/5" />
                          </div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className={cn(
                            "flex w-full",
                            isMe ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[75%] rounded-2xl px-4 py-2.5 text-xs text-text-primary relative shadow-md",
                              isMe
                                ? "bg-gradient-to-br from-brand-primary to-brand-accent text-white rounded-br-none border border-white/10"
                                : "bg-surface-secondary border border-white/5 rounded-bl-none text-text-primary"
                            )}
                          >
                            <p className="leading-relaxed break-words">{m.content}</p>
                            <span
                              className={cn(
                                "text-[8px] mt-1 flex items-center justify-end gap-1 font-semibold select-none opacity-80",
                                isMe ? "text-white/80" : "text-text-muted"
                              )}
                            >
                              <span>{formatMessageTime(m.createdAt)}</span>
                              {isMe && (
                                m.readAt ? (
                                  <CheckCheck className="h-3 w-3 text-blue-300" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )
                              )}
                            </span>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })
                )}
                {/* Typing indicator */}
                {sendMessageMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-surface-secondary border border-white/5 rounded-2xl rounded-bl-none px-4 py-3">
                      <div className="typing-dots flex gap-1">
                        <span /><span /><span />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input form */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-white/5 bg-surface-tertiary/10 relative"
              >
                {/* Emoji Picker Popup */}
                {showEmoji && (
                  <div className="absolute bottom-full left-4 right-4 mb-2 glass-strong rounded-2xl border border-white/10 p-3 shadow-elevated max-h-48 overflow-y-auto">
                    <div className="emoji-grid">
                      {EMOJI_LIST.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => insertEmoji(emoji)}
                          className="emoji-btn"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2.5 items-center">
                  <button
                    type="button"
                    onClick={() => setShowEmoji(!showEmoji)}
                    className={cn(
                      "rounded-xl p-2.5 transition-all shrink-0",
                      showEmoji
                        ? "bg-brand-primary/10 text-brand-primary"
                        : "text-text-muted hover:text-text-secondary hover:bg-white/5"
                    )}
                    aria-label="Toggle emoji picker"
                  >
                    <Smile className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.info("File attachment capability will be available soon!")}
                    className="rounded-xl p-2.5 text-text-muted hover:text-text-secondary hover:bg-white/5 transition-all shrink-0"
                    aria-label="Attach files"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <input
                    type="text"
                    required
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                    onFocus={() => setShowEmoji(false)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-xl bg-surface-secondary border border-white/10 px-4 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!typedMessage.trim() || sendMessageMutation.isPending}
                    className="rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent p-2.5 text-white hover:brightness-110 disabled:opacity-50 shadow-md transition-all shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="space-y-4 max-w-sm">
              <div className="rounded-full bg-brand-primary/10 p-5 border border-brand-primary/20 text-brand-primary w-fit mx-auto animate-bounce">
                <MessageSquare className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">No Chat Selected</h3>
                <p className="text-xs text-text-secondary mt-1">
                  Select a message conversation thread from the sidebar or click Chat on any local vendor profile to begin.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-surface-primary text-text-primary">
          <span className="animate-spin h-8 w-8 border-2 border-brand-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
