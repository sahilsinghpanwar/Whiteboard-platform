export const buildImprovePrompt = (originalText, instruction) => `
You are a writing improvement assistant for a collaborative whiteboard tool.

ORIGINAL TEXT:
"${originalText}"

IMPROVEMENT INSTRUCTION:
${instruction || 'Improve clarity, conciseness, and professionalism.'}

INSTRUCTIONS:
- Generate exactly 3 improved variants
- Each variant must preserve the core meaning of the original
- Keep improvements appropriate for a whiteboard context (concise, scannable)
- Label each variant with the primary improvement it makes

RESPOND WITH ONLY VALID JSON — no explanation, no markdown fences:
{
  "original": "${originalText.replace(/"/g, '\\"')}",
  "variants": [
    { "label": "More concise",    "content": "Improved version 1" },
    { "label": "More formal",     "content": "Improved version 2" },
    { "label": "More actionable", "content": "Improved version 3" }
  ]
}
`.trim();
