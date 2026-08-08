import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChatCircle, Sparkle, UsersThree, X } from "@phosphor-icons/react";
import ChatPanel from "./ChatPanel";
import AIPanel from "./AIPanel";
import MembersPanel from "./MembersPanel";

export default function RightDock({
  boardId,
  board,
  currentUser,
  selectedElements,
  onBoardUpdate,
  onChat,
  emitChat,
  onElementUpsert,
  isOpen = true,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <aside
      className="fixed md:absolute top-0 right-0 bottom-0 md:top-4 md:right-4 md:bottom-4 w-full xs:w-80 sm:w-80 z-50 md:z-40 flex flex-col bg-card border-l md:border rounded-none md:rounded-2xl float-shadow overflow-hidden transition-all duration-300"
      data-testid="right-dock"
    >
      <Tabs defaultValue="chat" className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-3 pt-3 gap-2">
          <TabsList className="grid grid-cols-3 flex-1 h-9">
            <TabsTrigger value="chat" data-testid="dock-tab-chat" className="px-1 text-xs">
              <ChatCircle size={14} className="mr-1 shrink-0" /> <span className="truncate">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="ai" data-testid="dock-tab-ai" className="px-1 text-xs">
              <Sparkle size={14} className="mr-1 shrink-0" /> <span className="truncate">AI</span>
            </TabsTrigger>
            <TabsTrigger value="members" data-testid="dock-tab-members" className="px-1 text-xs">
              <UsersThree size={14} className="mr-1 shrink-0" /> <span className="truncate">Members</span>
            </TabsTrigger>
          </TabsList>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={onClose}
              title="Close panel"
              aria-label="Close panel"
            >
              <X size={16} />
            </Button>
          )}
        </div>

        <TabsContent value="chat" className="flex-1 mt-2 overflow-hidden">
          <ChatPanel boardId={boardId} currentUser={currentUser} onChat={onChat} emitChat={emitChat} />
        </TabsContent>

        <TabsContent value="ai" className="flex-1 mt-2 overflow-hidden">
          <AIPanel boardId={boardId} selectedElements={selectedElements} onElementUpsert={onElementUpsert} />
        </TabsContent>

        <TabsContent value="members" className="flex-1 mt-2 overflow-hidden">
          <MembersPanel board={board} currentUser={currentUser} onBoardUpdate={onBoardUpdate} />
        </TabsContent>
      </Tabs>
    </aside>
  );
}

