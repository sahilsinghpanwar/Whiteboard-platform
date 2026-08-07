import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PaperPlaneRight, Trash } from "@phosphor-icons/react";
import { chatApi } from "@/lib/services";
import UserAvatar from "@/components/shared/UserAvatar";
import { formatDate } from "@/lib/helpers";

export default function ChatPanel({ boardId, currentUser, onChat, emitChat }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState([]);
  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await chatApi.history(boardId);
        const list = Array.isArray(res) ? res : res?.data ?? [];
        setMessages(list);
      } catch (e) {
        console.error("Failed to fetch chat history", e);
      }
    })();
  }, [boardId]);

  useEffect(() => {
    const off1 = onChat("chat:message", (msg) =>
      setMessages((prev) => [...prev, msg])
    );
    const off2 = onChat("chat:deleted", ({ messageId }) =>
      setMessages((prev) => prev.filter((m) => m._id !== messageId))
    );
    const off3 = onChat("chat:typing", ({ userId, fullName }) => {
      setTyping((prev) =>
        prev.some((t) => t.userId === userId)
          ? prev
          : [...prev, { userId, fullName }]
      );
    });
    const off4 = onChat("chat:stop-typing", ({ userId }) =>
      setTyping((prev) => prev.filter((t) => t.userId !== userId))
    );
    return () => {
      off1();
      off2();
      off3();
      off4();
    };
  }, [onChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const content = text.trim();
    if (!content) return;
    emitChat("chat:send", { boardId, content, type: "text" });
    setText("");
    emitChat("chat:stop-typing", { boardId });
  };

  const onType = (v) => {
    setText(v);
    emitChat("chat:typing", { boardId });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(
      () => emitChat("chat:stop-typing", { boardId }),
      1200
    );
  };

  const del = async (msg) => {
    try {
      emitChat("chat:delete", { boardId, messageId: msg._id });
    } catch {
      toast.error("Could not delete message");
    }
  };

  const myId = currentUser?._id || currentUser?.id;

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3.5">
          {messages.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-10">
              No messages yet. Say hi 👋
            </div>
          )}
          {messages.map((m) => {
            const senderId = m.sender?._id || m.sender?.id || m.sender;
            const mine = String(senderId) === String(myId);
            const senderName =
              m.sender?.fullName || (mine ? currentUser?.fullName : "User");

            return (
              <div
                key={m._id || Math.random()}
                className={`group flex items-end gap-2 ${
                  mine ? "flex-row-reverse" : "flex-row"
                }`}
                data-testid={`chat-msg-${m._id}`}
              >
                {/* Avatar */}
                <UserAvatar
                  user={m.sender || { fullName: senderName }}
                  size={26}
                  className="shrink-0 mb-0.5"
                />

                {/* Message Content Container */}
                <div
                  className={`flex flex-col max-w-[78%] ${
                    mine ? "items-end" : "items-start"
                  }`}
                >
                  {/* Sender & Timestamp Header */}
                  <div
                    className={`flex items-center gap-1.5 mb-1 px-1 text-[11px] ${
                      mine ? "flex-row-reverse text-right" : "text-left"
                    }`}
                  >
                    {!mine && (
                      <span className="font-semibold text-foreground">
                        {senderName}
                      </span>
                    )}
                    <span className="text-muted-foreground text-[10px] font-mono">
                      {formatDate(m.createdAt)}
                    </span>
                    {mine && (
                      <button
                        onClick={() => del(m)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                        aria-label="Delete message"
                        title="Delete"
                      >
                        <Trash size={12} />
                      </button>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`px-3.5 py-2 text-sm leading-relaxed rounded-2xl break-words whitespace-pre-wrap shadow-sm ${
                      mine
                        ? "bg-primary text-primary-foreground rounded-br-xs"
                        : "bg-muted/80 text-foreground rounded-bl-xs border border-border/40"
                    }`}
                  >
                    {m.type === "image" && m.imageUrl ? (
                      <img
                        src={m.imageUrl}
                        alt=""
                        className="rounded-lg max-w-full border"
                      />
                    ) : (
                      <p>{m.content}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Typing Indicator */}
      {typing.length > 0 && (
        <div className="px-4 pb-1 text-xs text-muted-foreground italic">
          {typing.map((t) => t.fullName).join(", ")} typing…
        </div>
      )}

      {/* Message Input Box */}
      <div className="p-3 border-t bg-card/50 flex items-center gap-2">
        <Input
          value={text}
          onChange={(e) => onType(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())
          }
          placeholder="Message the team…"
          data-testid="chat-input"
          className="rounded-xl"
        />
        <Button
          size="icon"
          onClick={send}
          data-testid="chat-send-btn"
          className="rounded-xl shrink-0"
        >
          <PaperPlaneRight size={16} weight="fill" />
        </Button>
      </div>
    </div>
  );
}
