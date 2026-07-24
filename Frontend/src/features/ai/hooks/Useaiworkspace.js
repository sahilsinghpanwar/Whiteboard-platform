/**
 * useAIWorkspace Hook
 * Custom hook encapsulating AI Board Agent state, conversation memory,
 * prompt category management, simulated streaming progress steps,
 * API requests, and operation execution.
 */

import { useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { useBoardStore } from "@/features/board/store/Boardstore.js";
import { aiApi } from "../api/Ai.api.js";
import { CanvasOperationExecutor } from "../services/CanvasOperationExecutor.js";
import toast from "react-hot-toast";

export const PROMPT_CATEGORIES = [
  { id: "all", label: "All Prompts" },
  { id: "architecture", label: "Architecture", prompt: "Generate a Microservices System Architecture diagram with API Gateway, Auth, DB, and Redis" },
  { id: "roadmap", label: "Roadmap", prompt: "Create a Fullstack Web Development Roadmap diagram with step-by-step milestones" },
  { id: "backend", label: "Backend", prompt: "Design a Node.js Express & PostgreSQL Backend Architecture with Auth & Caching" },
  { id: "frontend", label: "Frontend", prompt: "Create a React + Redux/Zustand state management and component flow diagram" },
  { id: "database", label: "Database", prompt: "Generate a PostgreSQL E-commerce Database Schema with User, Product, and Order entities" },
  { id: "code", label: "Code Gen", prompt: "Generate a production-ready Express JWT Authentication Controller & Middleware code" },
  { id: "review", label: "Board Review", prompt: "Review everything on this board. Identify security issues, scaling bottlenecks, and bad naming" },
  { id: "summary", label: "Summary", prompt: "Summarize this entire board into an Executive Summary with Action Items and Next Steps" },
  { id: "mindmap", label: "Mind Map", prompt: "Create a Mind Map diagram exploring AI Engineering & LLM Application Development" },
];

export function useAIWorkspace({ emitElementUpdate, emitElementDelete, emitCanvasSave }) {
  const { boardId } = useParams();
  const { showAI, toggleAI, selectedElementIds, role, upsertElement } = useBoardStore();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamingStep, setStreamingStep] = useState(null);

  const canEdit = role === "owner" || role === "editor";
  const stepTimerRef = useRef(null);

  const startStreamingSimulation = () => {
    const steps = [
      "Understanding Board State...",
      "Planning Architecture & Canvas Operations...",
      "Generating Canvas Objects...",
      "Rendering Canvas & Connectors...",
    ];
    let i = 0;
    setStreamingStep(steps[0]);

    stepTimerRef.current = setInterval(() => {
      i++;
      if (i < steps.length) {
        setStreamingStep(steps[i]);
      } else {
        clearInterval(stepTimerRef.current);
      }
    }, 800);
  };

  const stopStreamingSimulation = () => {
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    setStreamingStep(null);
  };

  const handleSendPrompt = useCallback(
    async (customPrompt) => {
      const promptText = (typeof customPrompt === "string" ? customPrompt : input).trim();
      if (!promptText || isProcessing) return;

      setInput("");
      setIsProcessing(true);
      startStreamingSimulation();

      // Add user message to state
      const userMsg = { id: `user_${Date.now()}`, role: "user", content: promptText, timestamp: new Date() };
      setMessages((prev) => [...prev, userMsg]);

      try {
        // Build conversation history format
        const historyPayload = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));

        const res = await aiApi.agent(boardId, {
          prompt: promptText,
          selectedElementIds,
          conversationHistory: historyPayload,
        });

        const data = res.data?.data || {};
        const { message = "Request processed.", summary = "Processed canvas actions", operations = [] } = data;

        // Execute canvas operations
        let opResult = { created: 0, modified: 0, deleted: 0 };
        if (canEdit && operations.length > 0) {
          opResult = CanvasOperationExecutor.execute({
            operations,
            selectedElementIds,
            emitElementUpdate,
            emitElementDelete,
            emitCanvasSave,
          });
        }

        // Add AI message response
        const aiMsg = {
          id: `ai_${Date.now()}`,
          role: "ai",
          content: message,
          summary: summary || (opResult.created > 0 ? `Created ${opResult.created} canvas element(s)` : undefined),
          operationsCount: operations.length,
          opResult,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMsg]);

        if (opResult.created > 0 || opResult.modified > 0 || opResult.deleted > 0) {
          toast.success(`Canvas updated (${opResult.created} created, ${opResult.modified} modified)`);
        }
      } catch (err) {
        const errMsg = err.response?.data?.message || err.message || "Failed to process AI request";
        setMessages((prev) => [
          ...prev,
          { id: `err_${Date.now()}`, role: "ai", content: errMsg, isError: true, timestamp: new Date() },
        ]);
        toast.error(errMsg);
      } finally {
        stopStreamingSimulation();
        setIsProcessing(false);
      }
    },
    [boardId, input, isProcessing, messages, selectedElementIds, canEdit, emitElementUpdate, emitElementDelete, emitCanvasSave]
  );

  const handleClearChat = useCallback(() => {
    setMessages([]);
    toast.success("Conversation cleared");
  }, []);

  const handleInsertOnBoard = useCallback(
    (content) => {
      if (!canEdit) return toast.error("You have view-only access");
      const cleanText = content.replace(/[*_#`]/g, "").slice(0, 500);
      const sticky = {
        id: `ai_insert_${Date.now()}`,
        type: "sticky",
        x: 180 + Math.random() * 60,
        y: 180 + Math.random() * 60,
        width: 240,
        height: 200,
        data: { text: cleanText, bgColor: "#EDE9FE", textColor: "#1E293B" },
      };
      upsertElement(sticky);
      emitElementUpdate?.(sticky);
      toast.success("Inserted on board!");
    },
    [canEdit, upsertElement, emitElementUpdate]
  );

  return {
    showAI,
    toggleAI,
    messages,
    input,
    setInput,
    activeCategory,
    setActiveCategory,
    isProcessing,
    streamingStep,
    selectedElementIds,
    handleSendPrompt,
    handleClearChat,
    handleInsertOnBoard,
  };
}
