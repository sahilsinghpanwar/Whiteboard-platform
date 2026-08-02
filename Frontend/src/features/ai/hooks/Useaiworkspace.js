import { useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { useBoardStore } from "@/features/board/store/Boardstore.js";
import { aiApi } from "../api/Ai.api.js";
import { CanvasOperationExecutor } from "../services/CanvasOperationExecutor.js";
import toast from "react-hot-toast";

export function useAIWorkspace({ emitElementUpdate, emitElementDelete, emitCanvasSave }) {
  const { boardId } = useParams();
  const { showAI, toggleAI, selectedElementIds, role, upsertElement } = useBoardStore();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamingStep, setStreamingStep] = useState(null);

  const canEdit = role === "owner" || role === "editor";
  const stepTimerRef = useRef(null);

  const startStreamingSimulation = (isVision = false) => {
    const steps = isVision
      ? [
          "Analyzing Canvas Sketch with Gemini Vision...",
          "Extracting UI Elements & Structural Layout...",
          "Generating Polished HTML/CSS Component...",
        ]
      : [
          "Groq AI Engine Processing Request...",
          "Planning Architecture & Canvas Operations...",
          "Generating Canvas Objects...",
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
    }, 700);
  };

  const stopStreamingSimulation = () => {
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    setStreamingStep(null);
  };

  // 1. Text-In, Text-Out (Powered by Groq)
  const handleSendPrompt = useCallback(
    async (customPrompt) => {
      const promptText = (typeof customPrompt === "string" ? customPrompt : input).trim();
      if (!promptText || isProcessing) return;

      setInput("");
      setIsProcessing(true);
      startStreamingSimulation(false);

      const userMsg = { id: `user_${Date.now()}`, role: "user", content: promptText, timestamp: new Date() };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const historyPayload = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));

        const res = await aiApi.agent(boardId, {
          prompt: promptText,
          selectedElementIds,
          conversationHistory: historyPayload,
        });

        const data = res.data?.data || {};
        const { message = "Request processed.", summary = "Processed canvas actions", operations = [] } = data;

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

        const aiMsg = {
          id: `ai_${Date.now()}`,
          role: "ai",
          engine: "groq",
          content: message,
          summary: summary || (opResult.created > 0 ? `Created ${opResult.created} canvas element(s)` : undefined),
          operationsCount: operations.length,
          opResult,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMsg]);

        if (opResult.created > 0 || opResult.modified > 0 || opResult.deleted > 0) {
          toast.success(`Canvas updated via Groq (${opResult.created} created, ${opResult.modified} modified)`);
        }
      } catch (err) {
        const errMsg = err.response?.data?.message || err.message || "Failed to process Groq AI request";
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

  // 2. Multimodal Image-In, Code/Text-Out (Powered by Gemini Vision)
  const handleVisionPrompt = useCallback(
    async (promptText, imageBase64) => {
      if (!promptText || !imageBase64 || isProcessing) return;

      setIsProcessing(true);
      startStreamingSimulation(true);

      const userMsg = {
        id: `user_vision_${Date.now()}`,
        role: "user",
        content: `🎨 Sketch Polish Request: "${promptText}"`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const res = await aiApi.vision(boardId, {
          prompt: promptText,
          image: imageBase64,
          selectedElementIds,
        });

        const data = res.data?.data || {};
        const rawResponse = data.rawResponse || "Gemini Vision processing completed.";

        const aiMsg = {
          id: `gemini_vision_${Date.now()}`,
          role: "ai",
          engine: "gemini",
          content: rawResponse,
          summary: "Canvas sketch polished into UI / Code by Gemini Vision",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMsg]);
        toast.success("Sketch polished by Gemini Vision!");
      } catch (err) {
        const errMsg = err.response?.data?.message || err.message || "Failed to process Gemini Vision request";
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
    [boardId, isProcessing, selectedElementIds]
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
    isProcessing,
    streamingStep,
    selectedElementIds,
    handleSendPrompt,
    handleVisionPrompt,
    handleClearChat,
    handleInsertOnBoard,
  };
}
