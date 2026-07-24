import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { aiApi } from "@/features/ai/api/Ai.api.js";
import Button from "@/components/ui/Button";
import styles from "./AIPanel.module.css";

const AI_FEATURES = {
  BRAINSTORM: "brainstorm",
  DIAGRAM: "diagram",
  SUMMARY: "summary",
  IMPROVE: "improve",
};

// ─── Feature tab definitions ───────────────────────────────────────────────
const TABS = [
  {
    id: AI_FEATURES.BRAINSTORM,
    label: "Brainstorm",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26A7 7 0 0 1 12 2z" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M9 21h6M10 17v-4M14 17v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: AI_FEATURES.DIAGRAM,
    label: "Diagram",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="3" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="15" y="3" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="8" y="16" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M5.5 8v4h6M18.5 8v4h-6M12 12v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: AI_FEATURES.SUMMARY,
    label: "Summary",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: AI_FEATURES.IMPROVE,
    label: "Improve",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

// ─── Result renderers per feature ─────────────────────────────────────────
const BrainstormResult = ({ data }) => (
  <div className={styles.resultList}>
    {data.ideas?.map((idea, i) => (
      <div key={i} className={styles.ideaCard}>
        <div className={styles.ideaIndex}>{String(i + 1).padStart(2, "0")}</div>
        <div>
          <p className={styles.ideaTitle}>{idea.title}</p>
          <p className={styles.ideaDesc}>{idea.description}</p>
        </div>
      </div>
    ))}
  </div>
);

const DiagramResult = ({ data }) => (
  <div className={styles.resultCode}>
    <p className={styles.resultHint}>
      {data.nodes?.length} nodes · {data.edges?.length} edges generated.
      The diagram structure is ready to render on the canvas.
    </p>
    <div className={styles.diagramNodes}>
      {data.nodes?.map((n) => (
        <div key={n.id} className={styles.diagramNode}>
          <span className={styles.nodeId}>{n.id}</span>
          <span className={styles.nodeLabel}>{n.label}</span>
        </div>
      ))}
    </div>
  </div>
);

const SummaryResult = ({ data }) => (
  <div className={styles.summaryResult}>
    <div className={styles.summarySection}>
      <span className={styles.summaryLabel}>Main theme</span>
      <p className={styles.summaryText}>{data.mainTheme}</p>
    </div>
    {data.keyTopics?.length > 0 && (
      <div className={styles.summarySection}>
        <span className={styles.summaryLabel}>Key topics</span>
        <div className={styles.tagList}>
          {data.keyTopics.map((t, i) => (
            <span key={i} className={styles.tag}>{t}</span>
          ))}
        </div>
      </div>
    )}
    {data.actionItems?.length > 0 && (
      <div className={styles.summarySection}>
        <span className={styles.summaryLabel}>Action items</span>
        {data.actionItems.map((a, i) => (
          <p key={i} className={styles.listItem}>→ {a}</p>
        ))}
      </div>
    )}
    {data.nextSteps?.length > 0 && (
      <div className={styles.summarySection}>
        <span className={styles.summaryLabel}>Next steps</span>
        {data.nextSteps.map((s, i) => (
          <p key={i} className={styles.listItem}>· {s}</p>
        ))}
      </div>
    )}
  </div>
);

const ImproveResult = ({ data }) => (
  <div className={styles.improveResult}>
    <div className={styles.priorityCard}>
      <span className={styles.priorityLabel}>Priority action</span>
      <p className={styles.priorityText}>{data.priorityAction}</p>
    </div>
    {data.improvements?.map((imp, i) => (
      <div key={i} className={styles.improvementCard}>
        <span className={styles.improvementArea}>{imp.area}</span>
        <p className={styles.improvementIssue}>{imp.issue}</p>
        <p className={styles.improvementSuggestion}>{imp.suggestion}</p>
      </div>
    ))}
  </div>
);

// ─── AIPanel ───────────────────────────────────────────────────────────────
const AIPanel = ({ boardId }) => {
  const [activeTab, setActiveTab] = useState(AI_FEATURES.BRAINSTORM);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setResult(null);
    setInput("");
  };

  const handleRun = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      let res;
      switch (activeTab) {
        case AI_FEATURES.BRAINSTORM:
          if (!input.trim()) { toast.error("Enter a topic to brainstorm"); return; }
          res = await aiApi.brainstorm(boardId, input);
          break;
        case AI_FEATURES.DIAGRAM:
          if (!input.trim()) { toast.error("Describe the diagram to generate"); return; }
          res = await aiApi.generateDiagram(boardId, input);
          break;
        case AI_FEATURES.SUMMARY:
          res = await aiApi.summarize(boardId);
          break;
        case AI_FEATURES.IMPROVE:
          res = await aiApi.improve(boardId, input || undefined);
          break;
        default:
          return;
      }
      setResult(res.data.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const needsInput = [AI_FEATURES.BRAINSTORM, AI_FEATURES.DIAGRAM].includes(activeTab);
  const optionalInput = activeTab === AI_FEATURES.IMPROVE;

  const placeholders = {
    [AI_FEATURES.BRAINSTORM]: "e.g. ways to improve user onboarding",
    [AI_FEATURES.DIAGRAM]: "e.g. user authentication flow",
    [AI_FEATURES.IMPROVE]: "Optional: focus area (e.g. clarity)",
  };

  return (
    <motion.div
      className={styles.panel}
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerTitle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="var(--accent)" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <span>AI Assistant</span>
          </div>
        </div>
        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ""}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        {/* Input area */}
        {(needsInput || optionalInput) && (
          <div className={styles.inputSection}>
            <textarea
              className={styles.textarea}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholders[activeTab]}
              rows={3}
            />
          </div>
        )}

        <Button
          fullWidth
          isLoading={isLoading}
          onClick={handleRun}
          leftIcon={
            !isLoading && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 3l14 9-14 9V3z" fill="currentColor"/>
              </svg>
            )
          }
        >
          {isLoading ? "Generating…" : "Run"}
        </Button>

        {/* Results */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={activeTab}
              className={styles.results}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.resultsHeader}>
                <span className={styles.resultsLabel}>Result</span>
                <button
                  className={styles.clearBtn}
                  onClick={() => setResult(null)}
                  aria-label="Clear result"
                >
                  Clear
                </button>
              </div>

              {activeTab === AI_FEATURES.BRAINSTORM && <BrainstormResult data={result} />}
              {activeTab === AI_FEATURES.DIAGRAM && <DiagramResult data={result} />}
              {activeTab === AI_FEATURES.SUMMARY && <SummaryResult data={result} />}
              {activeTab === AI_FEATURES.IMPROVE && <ImproveResult data={result} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default AIPanel;