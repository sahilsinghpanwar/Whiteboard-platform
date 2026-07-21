import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useBoardStore } from "../store/Boardstore.js";
import { aiApi } from "@/features/ai/api/Ai.api.js";
import { Sparkles, Lightbulb, Workflow, FileText, Wand2, X, Sparkle } from "lucide-react";
import toast from "react-hot-toast";

export function AISidebar() {
  const { boardId } = useParams();
  const { showAI, toggleAI, upsertElement, elements } = useBoardStore();

  const [activeTab, setActiveTab] = useState("brainstorm");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [summaryResult, setSummaryResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!showAI) return null;

  // 1. Brainstorming Tool
  const handleBrainstorm = async () => {
    if (!topic.trim()) return toast.error("Please enter a topic");
    setIsLoading(true);
    try {
      const res = await aiApi.brainstorm(boardId, topic);
      const ideas = res.data.data?.ideas || res.data.data || [];

      const colors = ["#fef08a", "#bae6fd", "#bbf7d0", "#fbcfe8", "#e9d5ff"];
      ideas.forEach((idea, index) => {
        const sticky = {
          id: `ai_sticky_${Date.now()}_${index}`,
          type: "sticky",
          x: 120 + (index % 3) * 190,
          y: 120 + Math.floor(index / 3) * 190,
          width: 160,
          height: 160,
          data: {
            text: typeof idea === "string" ? idea : `${idea.title || ""}\n${idea.description || ""}`.trim(),
            bgColor: colors[index % colors.length],
            textColor: "#1e293b",
          },
        };
        upsertElement(sticky);
      });

      toast.success(`Generated ${ideas.length || 4} sticky note ideas!`);
      setTopic("");
    } catch (err) {
      toast.error(err.message || "Failed to generate ideas");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Diagram Tool
  const handleDiagram = async () => {
    if (!description.trim()) return toast.error("Please describe your diagram");
    setIsLoading(true);
    try {
      const res = await aiApi.generateDiagram(boardId, description);
      const diagramData = res.data.data || {};
      const nodes = diagramData.nodes || [];

      nodes.forEach((node, index) => {
        const shapeEl = {
          id: node.id || `node_${Date.now()}_${index}`,
          type: "rect",
          x: 100 + (index % 3) * 200,
          y: 100 + Math.floor(index / 3) * 140,
          width: 160,
          height: 80,
          data: {
            text: node.label || node.title || `Step ${index + 1}`,
            strokeColor: "#6366f1",
            fillColor: "#1e1b4b",
            borderRadius: 8,
          },
        };
        upsertElement(shapeEl);
      });

      toast.success("Diagram generated on canvas!");
      setDescription("");
    } catch (err) {
      toast.error(err.message || "Failed to generate diagram");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Summarizer Tool
  const handleSummarize = async () => {
    if (elements.length === 0) return toast.error("The board is empty - add some notes first!");
    setIsLoading(true);
    try {
      const res = await aiApi.summarize(boardId);
      setSummaryResult(res.data.data);
      toast.success("Board summarized by Gemini!");
    } catch (err) {
      toast.error(err.message || "Failed to summarize board");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside className="fixed right-4 top-20 z-40 w-80 max-h-[82vh] bg-[#18181c]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white animate-in slide-in-from-right-5 duration-200 font-sans">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-indigo-900/40">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          <h2 className="text-sm font-bold tracking-wide text-white">Gemini AI Workspace</h2>
        </div>
        <button
          onClick={toggleAI}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 p-1 bg-black/30">
        <button
          onClick={() => setActiveTab("brainstorm")}
          className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-all ${
            activeTab === "brainstorm" ? "bg-indigo-600 text-white shadow" : "text-zinc-400 hover:text-white"
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          Ideate
        </button>
        <button
          onClick={() => setActiveTab("diagram")}
          className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-all ${
            activeTab === "diagram" ? "bg-indigo-600 text-white shadow" : "text-zinc-400 hover:text-white"
          }`}
        >
          <Workflow className="w-3.5 h-3.5" />
          Diagram
        </button>
        <button
          onClick={() => setActiveTab("summary")}
          className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-all ${
            activeTab === "summary" ? "bg-indigo-600 text-white shadow" : "text-zinc-400 hover:text-white"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Summary
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {/* Brainstorm Tab */}
        {activeTab === "brainstorm" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">Topic / Challenge</label>
              <input
                type="text"
                placeholder="e.g. AI Features for Whiteboard App"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBrainstorm()}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={handleBrainstorm}
              disabled={isLoading}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4" />
              {isLoading ? "Brainstorming with Gemini..." : "Generate Sticky Notes"}
            </button>
          </div>
        )}

        {/* Diagram Tab */}
        {activeTab === "diagram" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">Diagram Architecture / Flow</label>
              <textarea
                rows={3}
                placeholder="e.g. Client -> API Gateway -> Auth Service -> Database"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
            <button
              onClick={handleDiagram}
              disabled={isLoading}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4" />
              {isLoading ? "Building Diagram..." : "Create Canvas Flowchart"}
            </button>
          </div>
        )}

        {/* Summary Tab */}
        {activeTab === "summary" && (
          <div className="space-y-3">
            <button
              onClick={handleSummarize}
              disabled={isLoading}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Sparkle className="w-4 h-4" />
              {isLoading ? "Analyzing Canvas..." : "Summarize Whole Board"}
            </button>

            {summaryResult && (
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2 text-xs">
                <h3 className="font-bold text-amber-300 text-sm">{summaryResult.title || "Board Overview"}</h3>
                <p className="text-zinc-300 leading-relaxed">{summaryResult.overview}</p>
                {summaryResult.keyPoints?.length > 0 && (
                  <div>
                    <span className="font-semibold text-zinc-400 block mb-1">Key Takeaways:</span>
                    <ul className="list-disc pl-4 space-y-1 text-zinc-300">
                      {summaryResult.keyPoints.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

export default AISidebar;
