// export const buildDiagramPrompt = (boardContext, description) => `
// You are a diagram generation assistant for a collaborative whiteboard tool.

// BOARD CONTEXT (existing canvas content for positioning reference):
// ${boardContext || 'The canvas is empty. Center the diagram around x:400, y:300.'}

// USER REQUEST:
// Generate a diagram for: "${description}"

// INSTRUCTIONS:
// - Choose the most appropriate diagram type (flowchart, mindmap, or sequence)
// - Create between 4 and 10 nodes
// - Position nodes so they don't overlap (space them at least 150px apart)
// - Use descriptive but short labels (under 5 words each)
// - Only add edges that represent a real relationship or flow

// SHAPES available: "rectangle" | "ellipse" | "diamond" | "rounded"
// Use "diamond" for decision nodes, "ellipse" for start/end, "rectangle" for process steps.

// RESPOND WITH ONLY VALID JSON — no explanation, no markdown fences:
// {
//   "type": "flowchart",
//   "nodes": [
//     { "id": "n1", "label": "Start", "shape": "ellipse", "x": 400, "y": 100 }
//   ],
//   "edges": [
//     { "from": "n1", "to": "n2", "label": "optional edge label" }
//   ]
// }
// `.trim();


// ============================================================
//  diagram.prompt.js  —  Improved Prompt Builder
//  Whiteboard Platform — AI Diagram Generation
// ============================================================

// ─── Color System ───────────────────────────────────────────
// Per diagram-type consistent colors
// AI ko exact values de do — guessing band
const COLOR_SYSTEM = {
  flowchart: {
    start:    { fill: '#22C55E', stroke: '#15803D', text: '#FFFFFF' }, // green  — start/end
    process:  { fill: '#3B82F6', stroke: '#1D4ED8', text: '#FFFFFF' }, // blue   — rectangle
    decision: { fill: '#F59E0B', stroke: '#B45309', text: '#FFFFFF' }, // amber  — diamond
    rounded:  { fill: '#8B5CF6', stroke: '#6D28D9', text: '#FFFFFF' }, // purple — rounded rect
    edge:     { stroke: '#64748B', text: '#475569' },
  },
  mindmap: {
    root:     { fill: '#0F172A', stroke: '#1E293B', text: '#FFFFFF' }, // dark   — central node
    branch:   { fill: '#3B82F6', stroke: '#1D4ED8', text: '#FFFFFF' }, // blue   — level-1
    leaf:     { fill: '#E2E8F0', stroke: '#CBD5E1', text: '#1E293B' }, // light  — level-2+
    edge:     { stroke: '#94A3B8', text: '#64748B' },
  },
  sequence: {
    actor:    { fill: '#6366F1', stroke: '#4338CA', text: '#FFFFFF' }, // indigo — actor box
    message:  { fill: 'transparent', stroke: '#64748B', text: '#334155' },
    edge:     { stroke: '#64748B', text: '#475569' },
  },
};

// ─── Layout Rules ────────────────────────────────────────────
// Per diagram-type exact positioning rules
// AI ko batao kahan se start kare, kaise space kare
const LAYOUT_RULES = {
  flowchart: `
FLOWCHART LAYOUT RULES:
- Direction: TOP to BOTTOM (increasing Y)
- Start node: x:500, y:80
- Each row: increment Y by 160px minimum
- Multiple nodes in same row: space X by 220px minimum
- Diamond (decision): next two branches split left (x-200) and right (x+200)
- End node: below all other nodes
- Canvas bounds: x between 80 and 1100, y between 80 and 750
`,
  mindmap: `
MINDMAP LAYOUT RULES:
- Root node: center at x:550, y:400
- Level-1 branches: equally spaced in a circle, radius 220px from root
  - Use trigonometry: x = 550 + 220*cos(angle), y = 400 + 220*sin(angle)
  - For N branches: angle_i = (2*PI/N)*i
- Level-2 leaves: radius 140px from their parent branch node
- Canvas bounds: x between 80 and 1100, y between 80 and 750
`,
  sequence: `
SEQUENCE DIAGRAM LAYOUT RULES:
- Direction: LEFT to RIGHT (actors as columns)
- Actor boxes: y:60, space X by 200px starting from x:150
- Message arrows: horizontal, y increments by 80px per message
- Actor lifelines: vertical dashed line from each actor box downward
- Canvas bounds: x between 80 and 1100, y between 60 and 780
`,
};

// ─── Schema Definition ────────────────────────────────────────
// Complete JSON schema with EVERY field explicitly defined
// No optional ambiguity — AI must fill everything
const JSON_SCHEMA = `
EXACT JSON SCHEMA — every field is REQUIRED, no exceptions:

{
  "diagramType": "flowchart" | "mindmap" | "sequence",
  "title": "short diagram title (max 5 words)",
  "canvasBounds": { "width": 1200, "height": 800 },
  "nodes": [
    {
      "id": "n1",                      // unique, alphanumeric, no spaces
      "label": "Node Label",           // max 4 words, concise
      "shape": "rectangle" | "ellipse" | "diamond" | "rounded",
      "x": 500,                        // CENTER x of node (number, not string)
      "y": 80,                         // CENTER y of node (number, not string)
      "width": 160,                    // always provide (rectangle:160, ellipse:140, diamond:160)
      "height": 50,                    // always provide (rectangle:50, ellipse:50, diamond:70)
      "fill": "#3B82F6",              // hex color, never null
      "stroke": "#1D4ED8",            // hex color, never null
      "textColor": "#FFFFFF",          // hex color, never null
      "fontSize": 14,                  // number: 13-16 range
      "nodeRole": "start" | "end" | "process" | "decision" | "root" | "branch" | "leaf" | "actor"
    }
  ],
  "edges": [
    {
      "id": "e1",                      // unique edge id
      "from": "n1",                    // must match a valid node id
      "to": "n2",                      // must match a valid node id
      "label": "",                     // edge label OR empty string — never null or omit
      "stroke": "#64748B",            // hex color
      "labelColor": "#475569",         // hex color
      "style": "solid" | "dashed"     // solid for normal, dashed for optional/async
    }
  ]
}
`;

// ─── Board Context Formatter ──────────────────────────────────
// Tumhara existing boardContext better format mein
const formatBoardContext = (boardContext) => {
  if (!boardContext || boardContext.trim() === '') {
    return `Canvas is currently empty.
Recommended starting position: center your diagram around x:550, y:400.
Available space: full canvas (0-1200 wide, 0-800 tall).`;
  }

  return `Existing canvas content (use this to AVOID overlap):
${boardContext}

IMPORTANT: Place new diagram nodes at least 150px away from any
existing node coordinates listed above. Prefer empty regions of canvas.`;
};

// ─── Diagram Type Detector ────────────────────────────────────
// User ke description se best diagram type suggest karo AI ko
const getDiagramTypeHint = (description) => {
  const d = description.toLowerCase();

  if (d.match(/flow|process|step|pipeline|auth|login|signup|checkout|order|deploy/))
    return 'flowchart';
  if (d.match(/mind|idea|brain|concept|topic|category|feature|plan/))
    return 'mindmap';
  if (d.match(/sequence|api|request|response|service|actor|interact|message|call/))
    return 'sequence';

  return null; // AI decide kare
};

// ─── Main Prompt Builder ──────────────────────────────────────
export const buildDiagramPrompt = (boardContext, description) => {
  const typeHint = getDiagramTypeHint(description);
  const formattedContext = formatBoardContext(boardContext);
  const colorRef = JSON.stringify(COLOR_SYSTEM, null, 2);

  return `
You are an expert diagram generation engine for a collaborative whiteboard application.
Your output is consumed directly by a JavaScript renderer — precision and correctness are critical.

════════════════════════════════════════
BOARD CONTEXT
════════════════════════════════════════
${formattedContext}

════════════════════════════════════════
USER REQUEST
════════════════════════════════════════
Generate a diagram for: "${description}"

${typeHint
  ? `RECOMMENDED DIAGRAM TYPE: "${typeHint}" (based on description keywords)`
  : `Choose the most appropriate type: "flowchart", "mindmap", or "sequence"`
}

════════════════════════════════════════
NODE COUNT RULES
════════════════════════════════════════
- Minimum: 4 nodes
- Maximum: 10 nodes
- Sweet spot: 6-8 nodes for readability
- Quality over quantity — fewer meaningful nodes > many vague nodes
- Every node must serve a purpose in the diagram

════════════════════════════════════════
LAYOUT RULES (follow strictly)
════════════════════════════════════════
${typeHint ? LAYOUT_RULES[typeHint] : `
Apply the layout rule for whichever diagramType you choose:
FLOWCHART: top-to-bottom, start at x:500 y:80, increment Y by 160px per row
MINDMAP: root at x:550 y:400, branches in circle radius 220px
SEQUENCE: actors as columns at y:60, messages increment Y by 80px
`}

════════════════════════════════════════
COLOR SYSTEM (use these exact values)
════════════════════════════════════════
${colorRef}

Apply colors based on nodeRole:
- flowchart → start/end: use start colors | process steps: use process colors | decisions: use decision colors
- mindmap → root: use root colors | level-1: use branch colors | level-2+: use leaf colors
- sequence → actor boxes: use actor colors

════════════════════════════════════════
LABEL WRITING RULES
════════════════════════════════════════
- Max 4 words per node label
- Use Title Case
- Be specific: "Validate User Input" not "Check"
- Edge labels: only when they add meaning (Yes/No on decisions, method names on sequence)
- If edge needs no label, set label to empty string ""

════════════════════════════════════════
EDGE RULES
════════════════════════════════════════
- Every edge must connect two VALID node ids from your nodes array
- No self-loops (from and to must differ)
- No duplicate edges between same pair
- Flowchart: decision diamond must have exactly 2 outgoing edges
- Use "dashed" style for optional or async flows, "solid" for normal flow

════════════════════════════════════════
OUTPUT SCHEMA
════════════════════════════════════════
${JSON_SCHEMA}

════════════════════════════════════════
CRITICAL OUTPUT RULES
════════════════════════════════════════
1. Return ONLY the raw JSON object — zero explanation, zero markdown, zero code fences
2. No trailing commas in JSON
3. All coordinate values must be NUMBERS, not strings
4. All color values must be valid HEX strings starting with #
5. Every node id referenced in edges MUST exist in nodes array
6. Validate your own output before returning — check all edge references

RESPOND NOW WITH ONLY THE JSON:
`.trim();
};

// ─── Response Validator ───────────────────────────────────────
// AI ke response ko validate karo parse se pehle
export const validateDiagramResponse = (parsed) => {
  const errors = [];

  // Required top-level fields
  if (!parsed.diagramType) errors.push('Missing: diagramType');
  if (!parsed.title) errors.push('Missing: title');
  if (!Array.isArray(parsed.nodes)) errors.push('Missing: nodes array');
  if (!Array.isArray(parsed.edges)) errors.push('Missing: edges array');

  if (errors.length > 0) return { valid: false, errors };

  // Node count
  if (parsed.nodes.length < 2) errors.push('Too few nodes (minimum 2)');
  if (parsed.nodes.length > 12) errors.push('Too many nodes (maximum 12)');

  // Node field validation
  const nodeIds = new Set();
  parsed.nodes.forEach((node, i) => {
    if (!node.id) errors.push(`Node[${i}]: missing id`);
    else nodeIds.add(node.id);

    if (!node.label) errors.push(`Node[${i}]: missing label`);
    if (typeof node.x !== 'number') errors.push(`Node[${i}]: x must be number`);
    if (typeof node.y !== 'number') errors.push(`Node[${i}]: y must be number`);
    if (!node.fill || !node.fill.startsWith('#')) errors.push(`Node[${i}]: invalid fill color`);
    if (!node.stroke || !node.stroke.startsWith('#')) errors.push(`Node[${i}]: invalid stroke color`);

    // Canvas bounds check
    if (node.x < 0 || node.x > 1200) errors.push(`Node[${i}] "${node.id}": x out of bounds (${node.x})`);
    if (node.y < 0 || node.y > 800) errors.push(`Node[${i}] "${node.id}": y out of bounds (${node.y})`);
  });

  // Edge validation
  parsed.edges.forEach((edge, i) => {
    if (!nodeIds.has(edge.from)) errors.push(`Edge[${i}]: invalid 'from' id "${edge.from}"`);
    if (!nodeIds.has(edge.to)) errors.push(`Edge[${i}]: invalid 'to' id "${edge.to}"`);
    if (edge.from === edge.to) errors.push(`Edge[${i}]: self-loop not allowed`);
    if (edge.label === undefined || edge.label === null) errors.push(`Edge[${i}]: label must be string (use "" if empty)`);
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};

// ─── Safe Parser ──────────────────────────────────────────────
// AI response safely parse karo with cleaning
export const parseDiagramResponse = (rawResponse) => {
  try {
    // Step 1: markdown fences strip karo (safety net)
    const cleaned = rawResponse
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    // Step 2: parse
    const parsed = JSON.parse(cleaned);

    // Step 3: validate
    const { valid, errors } = validateDiagramResponse(parsed);
    if (!valid) {
      console.warn('[DiagramParser] Validation warnings:', errors);
      // Soft fail — return parsed with warnings, let renderer handle gracefully
    }

    // Step 4: defaults inject karo for missing optional fields
    parsed.nodes = parsed.nodes.map((node) => ({
      width: 160,
      height: 50,
      fontSize: 14,
      textColor: '#FFFFFF',
      nodeRole: 'process',
      ...node, // node ke values override karenge defaults ko
    }));

    parsed.edges = parsed.edges.map((edge) => ({
      label: '',
      stroke: '#64748B',
      labelColor: '#475569',
      style: 'solid',
      ...edge,
    }));

    return { success: true, diagram: parsed, errors };

  } catch (err) {
    return {
      success: false,
      diagram: null,
      errors: [`JSON parse failed: ${err.message}`],
    };
  }
};