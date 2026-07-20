export const buildBrainstormPrompt = (boardContext, topic) => `
You are a creative brainstorming assistant for a collaborative whiteboard tool.

BOARD CONTEXT (what is currently on the canvas):
${boardContext || 'The canvas is empty.'}

USER REQUEST:
Generate brainstorming ideas for the following topic: "${topic}"

INSTRUCTIONS:
- Generate exactly 6 creative, concise ideas
- Each idea should be directly relevant to both the topic and any existing board content
- Keep titles under 8 words
- Keep descriptions under 30 words
- Assign a pastel color to visually group related ideas

RESPOND WITH ONLY VALID JSON — no explanation, no markdown fences:
[
  {
    "title": "Short idea title",
    "description": "Brief elaboration of the idea.",
    "color": "#fef08a"
  }
]

Available colors: "#fef08a" (yellow), "#bbf7d0" (green), "#bfdbfe" (blue), "#fecaca" (red), "#e9d5ff" (purple)
`.trim();
