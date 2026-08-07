import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { aiApi } from "@/lib/services";
import { Sparkle, ArrowClockwise, Lightning, Article, MagicWand } from "@phosphor-icons/react";

const Section = ({ title, children, id }) => (
  <div className="space-y-2">
    {id ? (
      <label htmlFor={id} className="label-mono block cursor-pointer">{title}</label>
    ) : (
      <div className="label-mono">{title}</div>
    )}
    {children}
  </div>
);

const ResultBlock = ({ result }) => {
  if (!result) return null;
  return (
    <div className="mt-3 p-3 rounded-lg bg-muted/50 border text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
      {typeof result === "string" ? result : JSON.stringify(result, null, 2)}
    </div>
  );
};

export default function AIPanel({ boardId, selectedElements }) {
  const [tab, setTab] = useState("agent");
  const [busy, setBusy] = useState(false);

  // Agent
  const [prompt, setPrompt] = useState("");
  const [agentResult, setAgentResult] = useState(null);

  // Brainstorm
  const [topic, setTopic] = useState("");
  const [brainstormResult, setBrainstormResult] = useState(null);

  // Diagram
  const [description, setDescription] = useState("");
  const [diagramResult, setDiagramResult] = useState(null);

  // Summary
  const [summaryResult, setSummaryResult] = useState(null);

  // Improve
  const [instruction, setInstruction] = useState("");
  const [improveResult, setImproveResult] = useState(null);

  const wrap = async (fn, setter) => {
    setter(null);
    setBusy(true);
    try {
      const res = await fn();
      setter(res?.data ?? res);
    } catch (e) { toast.error(e?.response?.data?.message || "AI request failed"); }
    finally { setBusy(false); }
  };

  const runAgent = () => wrap(
    () => aiApi.agent(boardId, { prompt, selectedElementIds: selectedElements.map((e) => e.id) }),
    setAgentResult
  );
  const runBrainstorm = () => wrap(() => aiApi.brainstorm(boardId, topic), setBrainstormResult);
  const runDiagram    = () => wrap(() => aiApi.diagram(boardId, description), setDiagramResult);
  const runSummary    = () => wrap(() => aiApi.summary(boardId), setSummaryResult);
  const runImprove    = () => wrap(() => aiApi.improve(boardId, { selectedElements, instruction }), setImproveResult);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Sparkle size={14} weight="fill" />
        </div>
        <div>
          <div className="text-sm font-semibold">AI Copilot</div>
          <div className="text-[10px] font-mono text-muted-foreground">Gemini · Groq</div>
        </div>
      </div>
      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-3 mt-3 grid grid-cols-5 h-9">
          <TabsTrigger value="agent" aria-label="Ask the agent" data-testid="ai-tab-agent"><Sparkle size={14} /></TabsTrigger>
          <TabsTrigger value="brainstorm" aria-label="Brainstorm ideas" data-testid="ai-tab-brainstorm"><Lightning size={14} /></TabsTrigger>
          <TabsTrigger value="diagram" aria-label="Generate diagram" data-testid="ai-tab-diagram"><MagicWand size={14} /></TabsTrigger>
          <TabsTrigger value="summary" aria-label="Summarize board" data-testid="ai-tab-summary"><Article size={14} /></TabsTrigger>
          <TabsTrigger value="improve" aria-label="Improve selected text" data-testid="ai-tab-improve"><ArrowClockwise size={14} /></TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <div className="p-4">
            <TabsContent value="agent" className="mt-0">
              <Section title="Ask the agent" id="ai-agent-prompt">
                <Textarea id="ai-agent-prompt" placeholder="e.g. 'Draft a login flow diagram with 3 states'" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} data-testid="ai-agent-input" />
                <Button className="w-full" onClick={runAgent} disabled={busy || !prompt.trim()} data-testid="ai-agent-run">
                  {busy ? "Thinking…" : "Run"}
                </Button>
                <div className="text-[10px] font-mono text-muted-foreground">{selectedElements.length} element(s) selected as context</div>
                <ResultBlock result={agentResult} />
              </Section>
            </TabsContent>

            <TabsContent value="brainstorm" className="mt-0">
              <Section title="Brainstorm ideas" id="ai-brainstorm-topic">
                <Input id="ai-brainstorm-topic" placeholder="Topic (e.g. 'growth ideas for a SaaS')" value={topic} onChange={(e) => setTopic(e.target.value)} data-testid="ai-brainstorm-input" />
                <Button className="w-full" onClick={runBrainstorm} disabled={busy || !topic.trim()} data-testid="ai-brainstorm-run">Generate</Button>
                <ResultBlock result={brainstormResult} />
              </Section>
            </TabsContent>

            <TabsContent value="diagram" className="mt-0">
              <Section title="Generate diagram" id="ai-diagram-desc">
                <Textarea id="ai-diagram-desc" placeholder="Describe the process or system" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} data-testid="ai-diagram-input" />
                <Button className="w-full" onClick={runDiagram} disabled={busy || !description.trim()} data-testid="ai-diagram-run">Generate</Button>
                <ResultBlock result={diagramResult} />
              </Section>
            </TabsContent>

            <TabsContent value="summary" className="mt-0">
              <Section title="Summarize board">
                <p className="text-xs text-muted-foreground">Get a concise summary of everything on this board.</p>
                <Button className="w-full" onClick={runSummary} disabled={busy} data-testid="ai-summary-run">Summarize</Button>
                <ResultBlock result={summaryResult} />
              </Section>
            </TabsContent>

            <TabsContent value="improve" className="mt-0">
              <Section title="Improve selected text" id="ai-improve-instruction">
                <Input id="ai-improve-instruction" placeholder="Instruction (e.g. 'make it more concise')" value={instruction} onChange={(e) => setInstruction(e.target.value)} data-testid="ai-improve-input" />
                <div className="text-[10px] font-mono text-muted-foreground">{selectedElements.length} element(s) selected</div>
                <Button className="w-full" onClick={runImprove} disabled={busy || selectedElements.length === 0 || !instruction.trim()} data-testid="ai-improve-run">Improve</Button>
                <ResultBlock result={improveResult} />
              </Section>
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}





// import  { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { toast } from "sonner";
// import { aiApi } from "@/lib/services";
// import { uid } from "@/lib/helpers";
// import { Sparkle, ArrowClockwise, Lightning, Article, MagicWand, CheckCircle } from "@phosphor-icons/react";

// const Section = ({ title, children }) => (
//   <div className="space-y-2">
//     <div className="label-mono">{title}</div>
//     {children}
//   </div>
// );

// const ResultBlock = ({ result }) => {
//   if (!result) return null;
//   if (typeof result === "string") {
//     return (
//       <div className="mt-3 p-3 rounded-lg bg-muted/50 border text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
//         {result}
//       </div>
//     );
//   }
//   // Summary object
//   if (result.overview || result.title) {
//     return (
//       <div className="mt-3 space-y-2">
//         {result.title && <div className="font-semibold text-sm">{result.title}</div>}
//         {result.overview && <p className="text-sm text-muted-foreground">{result.overview}</p>}
//         {result.keyPoints?.length > 0 && (
//           <div>
//             <div className="label-mono mt-2 mb-1">key points</div>
//             <ul className="space-y-1">
//               {result.keyPoints.map((pt, i) => (
//                 <li key={i} className="text-xs flex items-start gap-1.5">
//                   <CheckCircle size={12} className="text-primary mt-0.5 shrink-0" />
//                   {pt}
//                 </li>
//               ))}
//             </ul>
//           </div>
//         )}
//         {result.nextSteps?.length > 0 && (
//           <div>
//             <div className="label-mono mt-2 mb-1">next steps</div>
//             <ul className="space-y-1">
//               {result.nextSteps.map((s, i) => (
//                 <li key={i} className="text-xs flex items-start gap-1.5">
//                   <span className="text-primary font-mono">{i + 1}.</span>
//                   {s}
//                 </li>
//               ))}
//             </ul>
//           </div>
//         )}
//       </div>
//     );
//   }
//   // Improve variants
//   if (result.variants) {
//     return (
//       <div className="mt-3 space-y-2">
//         {result.variants.map((v, i) => (
//           <div key={i} className="p-3 rounded-lg border bg-muted/50">
//             <div className="label-mono mb-1">{v.label}</div>
//             <p className="text-sm whitespace-pre-wrap">{v.content}</p>
//           </div>
//         ))}
//       </div>
//     );
//   }
//   return (
//     <div className="mt-3 p-3 rounded-lg bg-muted/50 border text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
//       {JSON.stringify(result, null, 2)}
//     </div>
//   );
// };

// // Convert AI operations/nodes to canvas elements
// const operationsToElements = (ops) => {
//   const elements = [];
//   const nodeMap = {}; // id -> element for connecting lines

//   const opList = Array.isArray(ops) ? ops : [];

//   opList.forEach((op) => {
//     if (op.type === "create" || op.type === "add") {
//       const id = uid();
//       nodeMap[op.id || id] = { id, x: op.x ?? 100, y: op.y ?? 100 };
//       if (op.object === "sticky") {
//         elements.push({
//           id, type: "sticky",
//           x: op.x ?? 100, y: op.y ?? 100, width: op.width ?? 180, height: op.height ?? 140,
//           data: { fill: op.color || op.bgColor || "#FEF08A", text: op.text || "Idea", fontSize: 14 },
//         });
//       } else if (op.object === "ellipse" || op.object === "circle") {
//         elements.push({
//           id, type: "ellipse",
//           x: op.x ?? 100, y: op.y ?? 100, width: op.width ?? 140, height: op.height ?? 80,
//           data: { fill: op.bgColor || "transparent", stroke: op.color || "#6D5EF7", strokeWidth: 2 },
//         });
//         if (op.text) {
//           elements.push({
//             id: uid(), type: "text",
//             x: (op.x ?? 100) + 10, y: (op.y ?? 100) + ((op.height ?? 80) / 2) - 10,
//             width: (op.width ?? 140) - 20, height: 30,
//             data: { text: op.text, fill: "#111", fontSize: 14 },
//           });
//         }
//       } else {
//         // rect (default)
//         elements.push({
//           id, type: "rect",
//           x: op.x ?? 100, y: op.y ?? 100, width: op.width ?? 160, height: op.height ?? 80,
//           data: { fill: op.bgColor || "transparent", stroke: op.color || "#6D5EF7", strokeWidth: 2, cornerRadius: 8 },
//         });
//         if (op.text) {
//           elements.push({
//             id: uid(), type: "text",
//             x: (op.x ?? 100) + 10, y: (op.y ?? 100) + ((op.height ?? 80) / 2) - 10,
//             width: (op.width ?? 160) - 20, height: 30,
//             data: { text: op.text, fill: "#111", fontSize: 14 },
//           });
//         }
//       }
//     } else if (op.type === "connect") {
//       const from = nodeMap[op.from];
//       const to = nodeMap[op.to];
//       if (from && to) {
//         elements.push({
//           id: uid(), type: "arrow", x: 0, y: 0, width: 0, height: 0,
//           data: {
//             points: [
//               from.x + 80, from.y + 40,
//               to.x + 80, to.y,
//             ],
//             stroke: "#94a3b8", strokeWidth: 2,
//           },
//         });
//       }
//     }
//   });

//   return elements;
// };

// // Convert brainstorm ideas to sticky elements
// const ideasToElements = (ideas) => {
//   if (!Array.isArray(ideas)) return [];
//   return ideas.map((idea, i) => ({
//     id: uid(), type: "sticky",
//     x: 60 + (i % 3) * 210, y: 80 + Math.floor(i / 3) * 190,
//     width: 180, height: 150,
//     data: {
//       fill: idea.color || "#FEF08A",
//       text: idea.title ? `${idea.title}${idea.description ? "\n" + idea.description : ""}` : String(idea),
//       fontSize: 13,
//     },
//   }));
// };

// // Convert diagram nodes to elements
// const diagramToElements = (diagram) => {
//   if (!diagram?.nodes) return [];
//   const ops = diagram.nodes.map((n) => ({
//     type: "create",
//     object: n.shape === "ellipse" || n.shape === "circle" ? "ellipse" : "rect",
//     id: n.id, text: n.label,
//     x: n.x ?? 100, y: n.y ?? 100,
//     width: 160, height: 80,
//   }));
//   const edgeOps = (diagram.edges || []).map((e) => ({
//     type: "connect", from: e.from, to: e.to,
//   }));
//   return operationsToElements([...ops, ...edgeOps]);
// };

// export default function AIPanel({ boardId, selectedElements, onElementsAdd }) {
//   const [tab, setTab] = useState("agent");
//   const [busy, setBusy] = useState(false);

//   const [prompt, setPrompt] = useState("");
//   const [agentResult, setAgentResult] = useState(null);

//   const [topic, setTopic] = useState("");
//   const [brainstormResult, setBrainstormResult] = useState(null);

//   const [description, setDescription] = useState("");
//   const [diagramResult, setDiagramResult] = useState(null);

//   const [summaryResult, setSummaryResult] = useState(null);

//   const [instruction, setInstruction] = useState("");
//   const [improveResult, setImproveResult] = useState(null);

//   const wrap = async (fn, setter) => {
//     setBusy(true);
//     try {
//       const res = await fn();
//       const data = res?.data ?? res;
//       setter(data);
//       return data;
//     } catch (e) {
//       toast.error(e?.response?.data?.message || "AI request failed");
//       return null;
//     } finally { setBusy(false); }
//   };

//   const runAgent = async () => {
//     const data = await wrap(
//       () => aiApi.agent(boardId, { prompt, selectedElementIds: selectedElements.map((e) => e.id) }),
//       setAgentResult
//     );
//     // If agent returned operations, add them to canvas
//     if (data?.operations?.length > 0 && onElementsAdd) {
//       const els = operationsToElements(data.operations);
//       if (els.length > 0) {
//         els.forEach((el) => onElementsAdd(el));
//         toast.success(`Added ${els.length} element(s) to canvas`);
//       }
//     }
//   };

//   const runBrainstorm = async () => {
//     const data = await wrap(() => aiApi.brainstorm(boardId, topic), setBrainstormResult);
//     if (Array.isArray(data) && data.length > 0 && onElementsAdd) {
//       const els = ideasToElements(data);
//       els.forEach((el) => onElementsAdd(el));
//       toast.success(`Added ${els.length} sticky notes to canvas`);
//     }
//   };

//   const runDiagram = async () => {
//     const data = await wrap(() => aiApi.diagram(boardId, description), setDiagramResult);
//     if (data?.nodes && onElementsAdd) {
//       const els = diagramToElements(data);
//       if (els.length > 0) {
//         els.forEach((el) => onElementsAdd(el));
//         toast.success(`Diagram added to canvas (${data.nodes.length} nodes)`);
//       }
//     }
//   };

//   const runSummary = () => wrap(() => aiApi.summary(boardId), setSummaryResult);

//   const runImprove = () => wrap(
//     () => aiApi.improve(boardId, { selectedElements, instruction }),
//     setImproveResult
//   );

//   return (
//     <div className="flex flex-col h-full">
//       <div className="p-3 border-b flex items-center gap-2">
//         <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
//           <Sparkle size={14} weight="fill" />
//         </div>
//         <div>
//           <div className="text-sm font-semibold">AI Copilot</div>
//           <div className="text-[10px] font-mono text-muted-foreground">Gemini · Groq</div>
//         </div>
//       </div>

//       <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col overflow-hidden">
//         <TabsList className="mx-3 mt-3 grid grid-cols-5 h-9">
//           <TabsTrigger value="agent" data-testid="ai-tab-agent" title="Agent"><Sparkle size={14} /></TabsTrigger>
//           <TabsTrigger value="brainstorm" data-testid="ai-tab-brainstorm" title="Brainstorm"><Lightning size={14} /></TabsTrigger>
//           <TabsTrigger value="diagram" data-testid="ai-tab-diagram" title="Diagram"><MagicWand size={14} /></TabsTrigger>
//           <TabsTrigger value="summary" data-testid="ai-tab-summary" title="Summary"><Article size={14} /></TabsTrigger>
//           <TabsTrigger value="improve" data-testid="ai-tab-improve" title="Improve"><ArrowClockwise size={14} /></TabsTrigger>
//         </TabsList>

//         <ScrollArea className="flex-1">
//           <div className="p-4">
//             <TabsContent value="agent" className="mt-0">
//               <Section title="Ask the agent">
//                 <Textarea
//                   placeholder="e.g. 'Draft a login flow diagram with 3 states'"
//                   value={prompt}
//                   onChange={(e) => setPrompt(e.target.value)}
//                   rows={4}
//                   data-testid="ai-agent-input"
//                 />
//                 <Button className="w-full" onClick={runAgent} disabled={busy || !prompt.trim()} data-testid="ai-agent-run">
//                   {busy ? "Thinking…" : "Run"}
//                 </Button>
//                 <div className="text-[10px] font-mono text-muted-foreground">
//                   {selectedElements.length} element(s) selected as context
//                 </div>
//                 {agentResult?.message && (
//                   <div className="mt-3 p-3 rounded-lg bg-muted/50 border text-sm whitespace-pre-wrap">
//                     {agentResult.message}
//                   </div>
//                 )}
//                 {agentResult?.operations?.length > 0 && (
//                   <div className="mt-1 text-xs text-primary font-mono">
//                     ✓ {agentResult.operations.length} operation(s) applied to canvas
//                   </div>
//                 )}
//               </Section>
//             </TabsContent>

//             <TabsContent value="brainstorm" className="mt-0">
//               <Section title="Brainstorm ideas">
//                 <Input
//                   placeholder="Topic (e.g. 'growth ideas for a SaaS')"
//                   value={topic}
//                   onChange={(e) => setTopic(e.target.value)}
//                   data-testid="ai-brainstorm-input"
//                 />
//                 <Button className="w-full" onClick={runBrainstorm} disabled={busy || !topic.trim()} data-testid="ai-brainstorm-run">
//                   {busy ? "Generating…" : "Generate sticky notes"}
//                 </Button>
//                 {Array.isArray(brainstormResult) && brainstormResult.length > 0 && (
//                   <div className="mt-3 text-xs text-primary font-mono">
//                     ✓ {brainstormResult.length} ideas added to canvas
//                   </div>
//                 )}
//               </Section>
//             </TabsContent>

//             <TabsContent value="diagram" className="mt-0">
//               <Section title="Generate diagram">
//                 <Textarea
//                   placeholder="Describe the process or system (e.g. 'user signup flow: landing → register → verify email → dashboard')"
//                   value={description}
//                   onChange={(e) => setDescription(e.target.value)}
//                   rows={4}
//                   data-testid="ai-diagram-input"
//                 />
//                 <Button className="w-full" onClick={runDiagram} disabled={busy || !description.trim()} data-testid="ai-diagram-run">
//                   {busy ? "Generating…" : "Generate & add to canvas"}
//                 </Button>
//                 {diagramResult?.nodes && (
//                   <div className="mt-3 text-xs text-primary font-mono">
//                     ✓ Diagram with {diagramResult.nodes.length} nodes added
//                   </div>
//                 )}
//               </Section>
//             </TabsContent>

//             <TabsContent value="summary" className="mt-0">
//               <Section title="Summarize board">
//                 <p className="text-xs text-muted-foreground">Get a concise summary of everything on this board.</p>
//                 <Button className="w-full" onClick={runSummary} disabled={busy} data-testid="ai-summary-run">
//                   {busy ? "Summarizing…" : "Summarize"}
//                 </Button>
//                 <ResultBlock result={summaryResult} />
//               </Section>
//             </TabsContent>

//             <TabsContent value="improve" className="mt-0">
//               <Section title="Improve selected text">
//                 <Input
//                   placeholder="Instruction (e.g. 'make it more concise')"
//                   value={instruction}
//                   onChange={(e) => setInstruction(e.target.value)}
//                   data-testid="ai-improve-input"
//                 />
//                 <div className="text-[10px] font-mono text-muted-foreground">
//                   {selectedElements.length} element(s) selected
//                 </div>
//                 <Button
//                   className="w-full"
//                   onClick={runImprove}
//                   disabled={busy || selectedElements.length === 0}
//                   data-testid="ai-improve-run"
//                 >
//                   {busy ? "Improving…" : "Improve"}
//                 </Button>
//                 <ResultBlock result={improveResult} />
//               </Section>
//             </TabsContent>
//           </div>
//         </ScrollArea>
//       </Tabs>
//     </div>
//   );
// }
