/**
 * Context Builder Utilities
 * Transforms raw whiteboard canvas state into structured text manifests for AI prompts.
 */

/**
 * Build a detailed text manifest of the entire whiteboard canvas.
 * Includes element count, coordinates, dimensions, text content, colors,
 * connector relationships, and highlights currently selected items.
 */
export const buildBoardContext = (canvas, selectedElementIds = []) => {
  if (!canvas?.elements?.length) {
    return 'BOARD STATE: The canvas is currently empty (0 elements). Center coordinates around x: 400, y: 300.';
  }

  const elements = canvas.elements;
  const selectedSet = new Set(selectedElementIds.map(String));
  const lines = [];

  lines.push(`BOARD SUMMARY: Total elements = ${elements.length}`);
  if (selectedSet.size > 0) {
    lines.push(`CURRENT USER SELECTION: ${selectedSet.size} element(s) selected [IDs: ${Array.from(selectedSet).join(', ')}]`);
  } else {
    lines.push('CURRENT USER SELECTION: No elements currently selected.');
  }

  lines.push('\nCANVAS OBJECTS DETAILED MANIFEST:');

  elements.forEach((el, index) => {
    const isSelected = selectedSet.has(String(el.id));
    const textContent = el.data?.text || el.data?.content || el.data?.label || '';
    const color = el.data?.bgColor || el.data?.fillColor || el.data?.strokeColor || 'default';
    const type = el.type || 'unknown';
    const width = el.width || 120;
    const height = el.height || 80;

    let elDesc = `[${index + 1}] ID: "${el.id}" | Type: ${type} | Pos: (${Math.round(el.x)}, ${Math.round(el.y)}) | Size: ${Math.round(width)}x${Math.round(height)} | Color: ${color}`;

    if (textContent.trim()) {
      elDesc += ` | Text: "${textContent.trim().replace(/\n/g, ' ')}"`;
    }

    if (isSelected) {
      elDesc += ' ⭐ [SELECTED BY USER]';
    }

    if (el.from && el.to) {
      elDesc += ` | Connector: ${el.from} ➔ ${el.to}`;
    }

    lines.push(`  ${elDesc}`);
  });

  return lines.join('\n');
};

/**
 * Build a focused context manifest containing ONLY the user-selected canvas elements.
 */
export const buildSelectionContext = (canvas, selectedElementIds = []) => {
  if (!canvas?.elements?.length || !selectedElementIds?.length) return '';
  const selectedSet = new Set(selectedElementIds.map(String));
  const selectedElements = canvas.elements.filter((el) => selectedSet.has(String(el.id)));

  if (!selectedElements.length) return '';

  return buildBoardContext({ elements: selectedElements }, selectedElementIds);
};

/**
 * Format recent conversation history (last 6 messages) into a clean chat log
 * for multi-turn AI agent prompts.
 */
export const formatConversationHistory = (history = []) => {
  if (!history || history.length === 0) return '';
  return history
    .slice(-6)
    .map((msg) => `${msg.role.toUpperCase()}: ${msg.content.slice(0, 300)}`)
    .join('\n');
};