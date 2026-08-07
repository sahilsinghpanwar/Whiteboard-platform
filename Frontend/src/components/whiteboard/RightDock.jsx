// import React from "react";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { ChatCircle, Sparkle, UsersThree } from "@phosphor-icons/react";
// import ChatPanel from "./ChatPanel";
// import AIPanel from "./AIPanel";
// import MembersPanel from "./MembersPanel";

// export default function RightDock({ boardId, board, currentUser, selectedElements, onBoardUpdate, onChat, emitChat }) {
//   return (
//     <aside className="absolute top-4 right-4 bottom-4 w-80 z-40 flex flex-col bg-card border rounded-2xl float-shadow overflow-hidden">
//       <Tabs defaultValue="chat" className="flex-1 flex flex-col overflow-hidden">
//         <TabsList className="grid grid-cols-3 mx-3 mt-3 h-9">
//           <TabsTrigger value="chat" data-testid="dock-tab-chat"><ChatCircle size={14} className="mr-1.5" /> Chat</TabsTrigger>
//           <TabsTrigger value="ai" data-testid="dock-tab-ai"><Sparkle size={14} className="mr-1.5" /> AI</TabsTrigger>
//           <TabsTrigger value="members" data-testid="dock-tab-members"><UsersThree size={14} className="mr-1.5" /> Members</TabsTrigger>
//         </TabsList>
//         <TabsContent value="chat" className="flex-1 mt-2 overflow-hidden">
//           <ChatPanel boardId={boardId} currentUser={currentUser} onChat={onChat} emitChat={emitChat} />
//         </TabsContent>
//         <TabsContent value="ai" className="flex-1 mt-2 overflow-hidden">
//           <AIPanel boardId={boardId} selectedElements={selectedElements} />
//         </TabsContent>
//         <TabsContent value="members" className="flex-1 mt-2 overflow-hidden">
//           <MembersPanel board={board} currentUser={currentUser} onBoardUpdate={onBoardUpdate} />
//         </TabsContent>
//       </Tabs>
//     </aside>
//   );
// }





import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChatCircle, Sparkle, UsersThree } from "@phosphor-icons/react";
import ChatPanel from "./ChatPanel";
import AIPanel from "./AIPanel";
import MembersPanel from "./MembersPanel";

export default function RightDock({
  boardId, board, currentUser, activeUsers = [], selectedElements,
  onBoardUpdate, onChat, emitChat, onElementsAdd,
}) {
  return (
    <aside className="absolute top-4 right-4 bottom-4 w-80 z-40 flex flex-col bg-card border rounded-2xl float-shadow overflow-hidden">
      <Tabs defaultValue="chat" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid grid-cols-3 mx-3 mt-3 h-9">
          <TabsTrigger value="chat" data-testid="dock-tab-chat">
            <ChatCircle size={14} className="mr-1.5" /> Chat
          </TabsTrigger>
          <TabsTrigger value="ai" data-testid="dock-tab-ai">
            <Sparkle size={14} className="mr-1.5" /> AI
          </TabsTrigger>
          <TabsTrigger value="members" data-testid="dock-tab-members">
            <UsersThree size={14} className="mr-1.5" /> Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 mt-2 overflow-hidden">
          <ChatPanel boardId={boardId} currentUser={currentUser} onChat={onChat} emitChat={emitChat} />
        </TabsContent>

        <TabsContent value="ai" className="flex-1 mt-2 overflow-hidden">
          <AIPanel
            boardId={boardId}
            selectedElements={selectedElements}
            onElementsAdd={onElementsAdd}
          />
        </TabsContent>

        <TabsContent value="members" className="flex-1 mt-2 overflow-hidden">
          <MembersPanel board={board} currentUser={currentUser} activeUsers={activeUsers} onBoardUpdate={onBoardUpdate}/>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
