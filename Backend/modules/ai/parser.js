import { ApiError } from '../../core/utils/ApiError.js';

// ── Base JSON Extractor ──────────────────────────────────────────────────
const extractJSON = (text) => {
  if (!text || typeof text !== 'string') {
    throw ApiError.internal('Empty response received from AI');
  }

  // Strip markdown code fences if present
  let cleaned = text
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try extracting JSON object/array block with regex
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // Fall through
      }
    }
    throw ApiError.internal('AI returned an unexpected response format. Please try again.');
  }
};

// ── Agent Master Response Parser ─────────────────────────────────────────

export const parseAgentResponse = (rawText) => {
  let parsed;
  try {
    parsed = extractJSON(rawText);
  } catch (err) {
    // Fallback if model outputs plain text markdown instead of structured JSON
    return {
      message: rawText.trim(),
      summary: 'Processed request',
      operations: [],
    };
  }

  // Ensure message field
  const message = typeof parsed.message === 'string'
    ? parsed.message
    : (typeof parsed.text === 'string' ? parsed.text : (typeof parsed.summary === 'string' ? parsed.summary : 'Response generated.'));

  const summary = typeof parsed.summary === 'string' ? parsed.summary : 'Processed request';

  // Extract operations list
  let operations = [];
  if (Array.isArray(parsed.operations)) {
    operations = parsed.operations;
  } else if (Array.isArray(parsed.actions)) {
    operations = parsed.actions;
  } else if (Array.isArray(parsed.nodes)) {
    // Convert legacy diagram node format into create operations
    const nodes = parsed.nodes;
    const edges = parsed.edges || [];
    nodes.forEach((n, i) => {
      operations.push({
        type: 'create',
        object: n.shape === 'ellipse' || n.shape === 'circle' ? 'circle' : 'rect',
        id: String(n.id || `node_${i + 1}`),
        text: String(n.label || n.title || `Step ${i + 1}`),
        x: Number(n.x || (100 + (i % 3) * 200)),
        y: Number(n.y || (120 + Math.floor(i / 3) * 150)),
        width: 160,
        height: 80,
        color: '#6D5EF7',
      });
    });
    edges.forEach((e) => {
      operations.push({
        type: 'connect',
        from: String(e.from || e.source || ''),
        to: String(e.to || e.target || ''),
        label: e.label ? String(e.label) : undefined,
      });
    });
  } else if (Array.isArray(parsed.ideas)) {
    // Convert legacy brainstorm format into sticky note operations
    parsed.ideas.forEach((idea, i) => {
      operations.push({
        type: 'create',
        object: 'sticky',
        id: `sticky_${i + 1}`,
        text: typeof idea === 'string' ? idea : `${idea.title || ''}\n${idea.description || ''}`.trim(),
        x: 100 + (i % 3) * 190,
        y: 100 + Math.floor(i / 3) * 190,
        width: 160,
        height: 160,
        color: idea.color || '#fef08a',
      });
    });
  }

  // Clean and sanitize operations
  const sanitizedOps = operations
    .filter((op) => op && typeof op === 'object')
    .map((op, index) => ({
      type: String(op.type || 'create').toLowerCase(),
      object: op.object ? String(op.object).toLowerCase() : 'rect',
      id: op.id ? String(op.id) : `op_${Date.now()}_${index}`,
      targetId: op.targetId ? String(op.targetId) : op.id ? String(op.id) : undefined,
      x: typeof op.x === 'number' ? op.x : undefined,
      y: typeof op.y === 'number' ? op.y : undefined,
      width: typeof op.width === 'number' ? op.width : undefined,
      height: typeof op.height === 'number' ? op.height : undefined,
      color: op.color || op.fillColor || op.strokeColor || undefined,
      bgColor: op.bgColor || op.fill || undefined,
      text: op.text || op.label || op.content || undefined,
      fontSize: typeof op.fontSize === 'number' ? op.fontSize : undefined,
      from: op.from ? String(op.from) : undefined,
      to: op.to ? String(op.to) : undefined,
      instruction: op.instruction ? String(op.instruction) : undefined,
    }));

  return {
    message,
    summary,
    operations: sanitizedOps,
  };
};

// ── Legacy Parsers ───────────────────────────────────────────────────────

export const parseBrainstormResponse = (text) => {
  const agentRes = parseAgentResponse(text);
  if (agentRes.operations.length > 0) {
    return agentRes.operations
      .filter((op) => op.object === 'sticky')
      .map((op) => ({ title: op.text || 'Idea', description: '', color: op.color || '#fef08a' }));
  }
  const lines = text.split('\n').map((l) => l.replace(/^[\d*•-]\s*/, '').trim()).filter(Boolean);
  return lines.slice(0, 6).map((line, i) => ({
    title: line.slice(0, 40),
    description: line.length > 40 ? line : '',
    color: '#fef08a',
  }));
};

export const parseDiagramResponse = (text) => {
  const agentRes = parseAgentResponse(text);
  const nodes = agentRes.operations.filter((op) => op.type === 'create' && op.object !== 'arrow');
  const edges = agentRes.operations.filter((op) => op.type === 'connect');

  return {
    type: 'flowchart',
    nodes: nodes.map((n) => ({ id: n.id, label: n.text || 'Step', shape: n.object, x: n.x || 100, y: n.y || 100 })),
    edges: edges.map((e) => ({ from: e.from, to: e.to, label: e.text })),
  };
};

export const parseSummaryResponse = (text) => {
  let data;
  try {
    data = extractJSON(text);
  } catch {
    return { title: 'Board Summary', overview: text.trim(), keyPoints: [], nextSteps: [] };
  }
  return {
    title: typeof data.title === 'string' ? data.title : 'Board Summary',
    overview: typeof data.overview === 'string' ? data.overview : typeof data.summary === 'string' ? data.summary : '',
    keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints.map(String) : [],
    nextSteps: Array.isArray(data.nextSteps) ? data.nextSteps.map(String) : [],
  };
};

export const parseImproveResponse = (text) => {
  let data;
  try {
    data = extractJSON(text);
  } catch {
    return { original: '', variants: [{ label: 'Improved', content: text }] };
  }
  const rawVariants = data.variants || data.improvements || [];
  return {
    original: String(data.original ?? ''),
    variants: Array.isArray(rawVariants) ? rawVariants.map((v, i) => ({ label: v.label || `Variant ${i + 1}`, content: v.content || String(v) })) : [],
  };
};
