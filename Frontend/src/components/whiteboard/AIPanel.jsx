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
          <div className="text-[10px] font-mono text-muted-foreground">Nova AI</div>
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





