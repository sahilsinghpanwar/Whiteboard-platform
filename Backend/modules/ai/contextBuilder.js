export const buildBoardContext = (canvas) => {
  if (!canvas?.elements?.length) return '';

  const lines = [];
  const groups = groupByType(canvas.elements);

  if (groups.text?.length) {
    lines.push('TEXT CONTENT ON BOARD:');
    groups.text.forEach((el, i) => {
      const content = el.data?.content ?? '';
      if (content.trim()) lines.push(`  ${i + 1}. "${content.trim()}"`);
    });
  }

  if (groups.sticky?.length) {
    lines.push('\nSTICKY NOTES:');
    groups.sticky.forEach((el, i) => {
      const content = el.data?.content ?? '';
      if (content.trim()) lines.push(`  ${i + 1}. "${content.trim()}"`);
    });
  }

  if (groups.shape?.length) {
    lines.push(`\nSHAPES: ${groups.shape.length} shape(s) on canvas`);
    const withLabels = groups.shape.filter((el) => el.data?.label);
    if (withLabels.length) {
      withLabels.forEach((el) => lines.push(`  - ${el.type}: "${el.data.label}"`));
    }
  }

  if (groups.arrow?.length || groups.line?.length) {
    const connectors = [...(groups.arrow ?? []), ...(groups.line ?? [])];
    lines.push(`\nCONNECTORS: ${connectors.length} connector(s) linking elements`);
    const withLabels = connectors.filter((el) => el.data?.label);
    if (withLabels.length) {
      withLabels.forEach((el) => lines.push(`  - "${el.data.label}"`));
    }
  }

  if (groups.image?.length) {
    lines.push(`\nIMAGES: ${groups.image.length} image(s) embedded`);
    const withAlt = groups.image.filter((el) => el.data?.alt);
    if (withAlt.length) {
      withAlt.forEach((el) => lines.push(`  - "${el.data.alt}"`));
    }
  }

  lines.push(`\nTOTAL ELEMENTS: ${canvas.elements.length}`);

  return lines.join('\n');
};

export const buildSelectionContext = (elements) => {
  if (!elements?.length) return '';
  return buildBoardContext({ elements });
};

//  Internal 

const TEXT_TYPES   = ['text', 'sticky'];
const SHAPE_TYPES  = ['rectangle', 'ellipse', 'diamond', 'triangle', 'rounded'];
const CONNECTOR_TYPES = ['arrow', 'line'];

const groupByType = (elements) => {
  const groups = {};
  for (const el of elements) {
    let bucket;
    if (TEXT_TYPES.includes(el.type))      bucket = el.type;
    else if (SHAPE_TYPES.includes(el.type)) bucket = 'shape';
    else if (CONNECTOR_TYPES.includes(el.type)) bucket = el.type;
    else if (el.type === 'image')           bucket = 'image';
    else                                    bucket = 'other';

    if (!groups[bucket]) groups[bucket] = [];
    groups[bucket].push(el);
  }
  return groups;
};
