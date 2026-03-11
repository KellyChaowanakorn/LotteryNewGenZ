import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

interface ChatMsg {
  id: number;
  userId: number;
  senderType: string;
  message: string;
  isRead: number;
  createdAt: number;
}

export function ChatBubble() {
  const { user, isAuthenticated } = useUser();
  const { language } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery<ChatMsg[]>({
    queryKey: [`/api/chat/${user?.id}`],
    enabled: isAuthenticated && !!user?.id && isOpen,
    refetchInterval: isOpen ? 3000 : false,
  });

  // Count unread from admin
  const unreadCount = messages.filter(m => m.senderType === "admin" && !m.isRead).length;

  // Also poll unread count when closed
  const { data: bgMessages = [] } = useQuery<ChatMsg[]>({
    queryKey: [`/api/chat/${user?.id}`],
    enabled: isAuthenticated && !!user?.id && !isOpen,
    refetchInterval: 15000,
  });
  const bgUnread = bgMessages.filter(m => m.senderType === "admin" && !m.isRead).length;

  const sendMutation = useMutation({
    mutationFn: async (msg: string) => {
      const res = await apiRequest("POST", "/api/chat", {
        userId: user?.id,
        senderType: "user",
        message: msg,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat/${user?.id}`] });
      setMessage("");
    },
  });

  // Mark as read when opening
  useEffect(() => {
    if (isOpen && user?.id && messages.some(m => m.senderType === "admin" && !m.isRead)) {
      apiRequest("POST", `/api/chat/${user.id}/read`, { senderType: "user" }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: [`/api/chat/${user?.id}`] });
    }
  }, [isOpen, user?.id, messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    sendMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isAuthenticated) return null;

  const displayUnread = isOpen ? unreadCount : bgUnread;

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ height: "28rem" }}>
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <div>
                <p className="font-bold text-sm">{language === "th" ? "แชทกับ Admin" : "Chat with Admin"}</p>
                <p className="text-xs opacity-80">{language === "th" ? "ตอบกลับภายใน 5 นาที" : "Reply within 5 min"}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-muted/30">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
                <MessageCircle className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">{language === "th" ? "เริ่มสนทนากับ Admin ได้เลย!" : "Start chatting with Admin!"}</p>
                <p className="text-xs mt-1 opacity-70">{language === "th" ? "สอบถามปัญหา หรือแจ้งถูกรางวัล" : "Ask questions or report winnings"}</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderType === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    msg.senderType === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border border-border rounded-bl-sm"
                  }`}>
                    <p className="break-words">{msg.message}</p>
                    <p className={`text-[10px] mt-1 ${msg.senderType === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {new Date(msg.createdAt * 1000).toLocaleTimeString(language === "th" ? "th-TH" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border bg-card">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={language === "th" ? "พิมพ์ข้อความ..." : "Type a message..."}
                className="flex-1 rounded-full bg-muted border-0"
                disabled={sendMutation.isPending}
              />
              <Button
                size="icon"
                className="rounded-full shrink-0"
                onClick={handleSend}
                disabled={!message.trim() || sendMutation.isPending}
              >
                {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6" />
            {displayUnread > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 border-2 border-background">
                {displayUnread}
              </Badge>
            )}
          </>
        )}
      </button>
    </>
  );
}
