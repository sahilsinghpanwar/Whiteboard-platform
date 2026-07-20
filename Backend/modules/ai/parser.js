import { ApiError } from '../../core/utils/ApiError.js';


//  Base 

const extractJSON = (text) => {
  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw ApiError.internal('AI returned an unexpected response format. Please try again.');
  }
};

//  Feature-specific parsers 

export const parseBrainstormResponse = (text) => {
  const data = extractJSON(text);

  if (!Array.isArray(data)) {
    throw ApiError.internal('Brainstorm response was not an array');
  }

  return data.map((item, i) => ({
    title:       typeof item.title === 'string'       ? item.title       : `Idea ${i + 1}`,
    description: typeof item.description === 'string' ? item.description : '',
    color:       typeof item.color === 'string'       ? item.color       : '#fef08a',
  }));
};

/**
 * Parse diagram response.
 * Expected: { type, nodes: [{ id, label, shape, x, y }], edges: [{ from, to, label? }] }
 */
export const parseDiagramResponse = (text) => {
  const data = extractJSON(text);

  if (!data.nodes || !Array.isArray(data.nodes)) {
    throw ApiError.internal('Diagram response missing nodes array');
  }
  if (!data.edges || !Array.isArray(data.edges)) {
    throw ApiError.internal('Diagram response missing edges array');
  }

  return {
    type:  data.type ?? 'flowchart',
    nodes: data.nodes.map((n) => ({
      id:    String(n.id ?? Math.random()),
      label: String(n.label ?? ''),
      shape: n.shape ?? 'rectangle',
      x:     Number(n.x ?? 0),
      y:     Number(n.y ?? 0),
    })),
    edges: data.edges.map((e) => ({
      from:  String(e.from ?? ''),
      to:    String(e.to ?? ''),
      label: e.label ? String(e.label) : undefined,
    })),
  };
};

/**
 * Parse summary response.
 * Expected: { title, overview, keyPoints[], nextSteps[] }
 */
export const parseSummaryResponse = (text) => {
  const data = extractJSON(text);

  return {
    title:     typeof data.title    === 'string' ? data.title    : 'Board Summary',
    overview:  typeof data.overview === 'string' ? data.overview : '',
    keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints.map(String) : [],
    nextSteps: Array.isArray(data.nextSteps) ? data.nextSteps.map(String) : [],
  };
};

/**
 * Parse improve response.
 * Expected: { original, variants: [{ label, content }] }
 */
export const parseImproveResponse = (text) => {
  const data = extractJSON(text);

  if (!Array.isArray(data.variants)) {
    throw ApiError.internal('Improve response missing variants array');
  }

  return {
    original: String(data.original ?? ''),
    variants: data.variants.map((v) => ({
      label:   typeof v.label   === 'string' ? v.label   : 'Variant',
      content: typeof v.content === 'string' ? v.content : '',
    })),
  };
};
