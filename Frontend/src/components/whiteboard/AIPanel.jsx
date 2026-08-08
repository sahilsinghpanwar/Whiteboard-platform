import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { aiApi } from "@/lib/services";
import { uid } from "@/lib/helpers";
import { Sparkle, ArrowClockwise, Lightning, Article, MagicWand } from "@phosphor-icons/react";

// Safe JSON parser for AI outputs
const parseAIResult = (raw) => {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") {
    let clean = raw.trim();
    if (clean.startsWith("```json")) {
      clean = clean.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (clean.startsWith("```")) {
      clean = clean.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    if (clean.startsWith("{") || clean.startsWith("[")) {
      try {
        return JSON.parse(clean);
      } catch {
        // keep raw text if parse fails
      }
    }
  }
  return raw;
};

// Convert AI operations array (create, connect) to canvas element objects
const operationsToElements = (ops) => {
  if (!Array.isArray(ops) || ops.length === 0) return [];
  const elements = [];
  const nodeMap = {};

  let nodeCount = 0;
  // Phase 1: Nodes (rect, ellipse, sticky)
  ops.forEach((op) => {
    if (op.type === "create" || op.type === "add" || (op.object && op.type !== "connect")) {
      const elementId = uid();
      const x = op.x ?? (100 + (nodeCount % 3) * 200);
      const y = op.y ?? (100 + Math.floor(nodeCount / 3) * 120);
      nodeCount++;
      const width = op.width ?? 160;
      const height = op.height ?? 80;
      const color = op.color || op.bgColor || "#6D5EF7";

      const nodeData = { id: elementId, x, y, width, height };
      if (op.id) nodeMap[op.id] = nodeData;
      nodeMap[elementId] = nodeData;

      if (op.object === "sticky") {
        elements.push({
          id: elementId,
          type: "sticky",
          x, y, width, height,
          data: {
            fill: color || "#FEF08A",
            text: op.text || "Idea",
            fontSize: op.fontSize || 14,
          },
        });
      } else if (op.object === "ellipse" || op.object === "circle") {
        elements.push({
          id: elementId,
          type: "ellipse",
          x, y, width, height,
          data: {
            fill: op.bgColor || "transparent",
            stroke: color,
            strokeWidth: 2,
          },
        });
        if (op.text) {
          elements.push({
            id: uid(),
            type: "text",
            x: x + 10,
            y: y + height / 2 - 10,
            width: width - 20,
            height: 30,
            data: {
              text: op.text,
              fill: "#111111",
              fontSize: op.fontSize || 14,
            },
          });
        }
      } else {
        // rect (default)
        elements.push({
          id: elementId,
          type: "rect",
          x, y, width, height,
          data: {
            fill: op.bgColor || "transparent",
            stroke: color,
            strokeWidth: 2,
            cornerRadius: 8,
          },
        });
        if (op.text) {
          elements.push({
            id: uid(),
            type: "text",
            x: x + 10,
            y: y + height / 2 - 10,
            width: width - 20,
            height: 30,
            data: {
              text: op.text,
              fill: "#111111",
              fontSize: op.fontSize || 14,
            },
          });
        }
      }
    }
  });

  // Phase 2: Connections & Arrows
  ops.forEach((op) => {
    if (op.type === "connect" || op.type === "arrow" || op.from) {
      const fromNode = nodeMap[op.from];
      const toNode = nodeMap[op.to];
      const color = op.color || "#6D5EF7";

      if (fromNode && toNode) {
        const startX = fromNode.x + fromNode.width / 2;
        const startY = fromNode.y + fromNode.height / 2;
        const endX = toNode.x + toNode.width / 2;
        const endY = toNode.y + toNode.height / 2;

        elements.push({
          id: uid(),
          type: "arrow",
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          data: {
            points: [startX, startY, endX, endY],
            stroke: color,
            strokeWidth: 2,
          },
        });

        if (op.label) {
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2 - 10;
          elements.push({
            id: uid(),
            type: "text",
            x: midX - 40,
            y: midY,
            width: 80,
            height: 20,
            data: {
              text: op.label,
              fill: color,
              fontSize: 12,
            },
          });
        }
      }
    }
  });

  return elements;
};

// Convert diagram structure (nodes, edges) to elements
const diagramToElements = (diagram) => {
  if (!diagram) return [];
  if (Array.isArray(diagram.operations)) return operationsToElements(diagram.operations);

  const ops = [];
  if (Array.isArray(diagram.nodes)) {
    diagram.nodes.forEach((n) => {
      ops.push({
        type: "create",
        object: n.shape === "ellipse" || n.shape === "circle" ? "ellipse" : "rect",
        id: n.id,
        text: n.label || n.text,
        x: n.x ?? 100,
        y: n.y ?? 100,
        width: n.width ?? 160,
        height: n.height ?? 80,
        color: n.color || "#6D5EF7",
      });
    });
  }
  if (Array.isArray(diagram.edges)) {
    diagram.edges.forEach((e) => {
      ops.push({
        type: "connect",
        from: e.from,
        to: e.to,
        label: e.label,
        color: e.color || "#6D5EF7",
      });
    });
  }
  return operationsToElements(ops);
};

// Convert brainstorm ideas to sticky note elements
const brainstormToElements = (ideas) => {
  if (!Array.isArray(ideas)) return [];
  return ideas.map((idea, i) => {
    const text = typeof idea === "string"
      ? idea
      : (idea?.title
          ? `${idea.title}${idea.description ? "\n" + idea.description : ""}`
          : (idea?.text || idea?.idea || idea?.description || idea?.content || String(idea)));
    const fill = typeof idea === "object" && idea?.color ? idea.color : "#FEF08A";
    return {
      id: uid(),
      type: "sticky",
      x: 80 + (i % 3) * 210,
      y: 100 + Math.floor(i / 3) * 160,
      width: 180,
      height: 140,
      data: {
        fill,
        text,
        fontSize: 13,
      },
    };
  });
};

// Helper to extract printable elements from result object
const extractElements = (data) => {
  const parsed = parseAIResult(data);
  if (!parsed) return [];
  if (Array.isArray(parsed)) return brainstormToElements(parsed);
  if (Array.isArray(parsed.operations)) return operationsToElements(parsed.operations);
  if (Array.isArray(parsed.nodes)) return diagramToElements(parsed);
  return [];
};

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

const ResultBlock = ({ result, onApplyCanvas, canEdit = true }) => {
  if (!result) return null;

  const parsed = parseAIResult(result);
  const elements = extractElements(parsed);
  const allSticky = elements.length > 0 && elements.every((el) => el.type === "sticky");

  if (typeof parsed === "string") {
    return (
      <div className="mt-3 p-3 rounded-xl bg-muted/60 border border-border text-xs sm:text-sm leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
        {parsed}
      </div>
    );
  }

  if (typeof parsed === "object") {
    const { title, overview, summary, keyPoints, nextSteps, variants, message } = parsed;

    return (
      <div className="mt-3 p-3.5 rounded-xl bg-muted/40 border border-border space-y-3 max-h-80 overflow-y-auto text-xs sm:text-sm">
        {(title || summary) && (
          <div className="font-semibold text-foreground text-sm tracking-tight border-b border-border/50 pb-2 flex items-center justify-between">
            <span>{title || summary}</span>
          </div>
        )}

        {(overview || message) && (
          <p className="text-muted-foreground leading-relaxed">
            {overview || message}
          </p>
        )}

        {/* 1-Click Draw to Canvas Button */}
        {elements.length > 0 && onApplyCanvas && (
          <Button
            size="sm"
            className="w-full gap-1.5 shadow-xs"
            onClick={() => onApplyCanvas(parsed)}
            disabled={!canEdit}
            title={!canEdit ? "Viewers do not have edit permission on this board" : undefined}
          >
            <MagicWand size={16} /> {allSticky ? `Add Sticky Notes to Canvas (${elements.length} items)` : `Draw Flow Diagram on Canvas (${elements.length} items)`}
          </Button>
        )}

        {Array.isArray(keyPoints) && keyPoints.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="label-mono text-[10px] text-muted-foreground">Key Points</div>
            <ul className="space-y-1.5 pl-1">
              {keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span className="flex-1 leading-snug">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {Array.isArray(nextSteps) && nextSteps.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-border/40">
            <div className="label-mono text-[10px] text-muted-foreground">Next Steps</div>
            <ol className="space-y-1.5 pl-1">
              {nextSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className="font-mono text-[10px] text-primary font-bold mt-0.5 shrink-0">
                    {i + 1}.
                  </span>
                  <span className="flex-1 leading-snug">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {Array.isArray(variants) && variants.length > 0 && (
          <div className="space-y-2 pt-1">
            {variants.map((v, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-background border border-border">
                {v.label && <div className="label-mono text-[10px] mb-1">{v.label}</div>}
                <p className="text-xs text-foreground whitespace-pre-wrap">{v.content || v}</p>
              </div>
            ))}
          </div>
        )}

        {!title && !overview && !keyPoints && !nextSteps && !variants && !message && elements.length === 0 && (
          <pre className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  return null;
};

export default function AIPanel({ boardId, selectedElements, onElementUpsert }) {
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

  const applyToCanvas = useCallback((data) => {
    if (!data) return 0;
    if (!onElementUpsert) {
      toast.error("Cannot add to canvas: edit handler is missing");
      return 0;
    }
    const elements = extractElements(data);
    if (elements.length > 0) {
      elements.forEach((el) => onElementUpsert(el));
      toast.success(`✓ Rendered ${elements.length} elements on whiteboard canvas!`);
      return elements.length;
    }
    return 0;
  }, [onElementUpsert]);

  const wrap = async (fn, setter, autoApply = false) => {
    setter(null);
    setBusy(true);
    try {
      const res = await fn();
      const rawData = res?.data ?? res;
      const parsedData = parseAIResult(rawData);
      setter(parsedData);
      if (autoApply && onElementUpsert) {
        applyToCanvas(parsedData);
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "AI request failed");
    } finally {
      setBusy(false);
    }
  };

  const runAgent = () => wrap(
    () => aiApi.agent(boardId, { prompt, selectedElementIds: selectedElements.map((e) => e.id) }),
    setAgentResult,
    true
  );
  const runBrainstorm = () => wrap(() => aiApi.brainstorm(boardId, topic), setBrainstormResult, true);
  const runDiagram    = () => wrap(() => aiApi.diagram(boardId, description), setDiagramResult, true);
  const runSummary    = () => wrap(() => aiApi.summary(boardId), setSummaryResult, false);
  const runImprove    = () => wrap(() => aiApi.improve(boardId, { selectedElements, instruction }), setImproveResult, false);

  const canEdit = !!onElementUpsert;

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
                <ResultBlock result={agentResult} onApplyCanvas={applyToCanvas} canEdit={canEdit} />
              </Section>
            </TabsContent>

            <TabsContent value="brainstorm" className="mt-0">
              <Section title="Brainstorm ideas" id="ai-brainstorm-topic">
                <Input id="ai-brainstorm-topic" placeholder="Topic (e.g. 'growth ideas for a SaaS')" value={topic} onChange={(e) => setTopic(e.target.value)} data-testid="ai-brainstorm-input" />
                <Button className="w-full" onClick={runBrainstorm} disabled={busy || !topic.trim()} data-testid="ai-brainstorm-run">Generate</Button>
                <ResultBlock result={brainstormResult} onApplyCanvas={applyToCanvas} canEdit={canEdit} />
              </Section>
            </TabsContent>

            <TabsContent value="diagram" className="mt-0">
              <Section title="Generate diagram" id="ai-diagram-desc">
                <Textarea id="ai-diagram-desc" placeholder="Describe the process or system" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} data-testid="ai-diagram-input" />
                <Button className="w-full" onClick={runDiagram} disabled={busy || !description.trim()} data-testid="ai-diagram-run">Generate</Button>
                <ResultBlock result={diagramResult} onApplyCanvas={applyToCanvas} canEdit={canEdit} />
              </Section>
            </TabsContent>

            <TabsContent value="summary" className="mt-0">
              <Section title="Summarize board">
                <p className="text-xs text-muted-foreground">Get a concise summary of everything on this board.</p>
                <Button className="w-full" onClick={runSummary} disabled={busy} data-testid="ai-summary-run">Summarize</Button>
                <ResultBlock result={summaryResult} onApplyCanvas={applyToCanvas} canEdit={canEdit} />
              </Section>
            </TabsContent>

            <TabsContent value="improve" className="mt-0">
              <Section title="Improve selected text" id="ai-improve-instruction">
                <Input id="ai-improve-instruction" placeholder="Instruction (e.g. 'make it more concise')" value={instruction} onChange={(e) => setInstruction(e.target.value)} data-testid="ai-improve-input" />
                <div className="text-[10px] font-mono text-muted-foreground">{selectedElements.length} element(s) selected</div>
                <Button className="w-full" onClick={runImprove} disabled={busy || selectedElements.length === 0 || !instruction.trim()} data-testid="ai-improve-run">Improve</Button>
                <ResultBlock result={improveResult} onApplyCanvas={applyToCanvas} canEdit={canEdit} />
              </Section>
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}






