import { useBoardStore } from '@/features/board/store/Boardstore.js';

/* Palette mappings */
const COLOR_MAP = {
  red: '#EF4444',
  green: '#10B981',
  blue: '#3B82F6',
  yellow: '#F59E0B',
  purple: '#8B5CF6',
  violet: '#6D5EF7',
  pink: '#EC4899',
  teal: '#14B8A6',
  orange: '#F97316',
};

const BG_COLOR_MAP = {
  red: '#FEE2E2',
  green: '#D1FAE5',
  blue: '#DBEAFE',
  yellow: '#FEF08A',
  purple: '#EDE9FE',
  violet: '#EDE9FE',
  pink: '#FCE7F3',
  teal: '#CCFBF1',
  orange: '#FFEDD5',
};

function resolveColor(c, isBg = false) {
  if (!c) return isBg ? '#F9FAFB' : '#6D5EF7';
  const lower = c.toLowerCase();
  if (isBg && BG_COLOR_MAP[lower]) return BG_COLOR_MAP[lower];
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  return c;
}

export const CanvasOperationExecutor = {
  execute: ({ operations = [], selectedElementIds = [], emitElementUpdate, emitElementDelete, emitCanvasSave }) => {
    if (!Array.isArray(operations) || operations.length === 0) return { created: 0, modified: 0, deleted: 0 };

    const store = useBoardStore.getState();
    const existingElements = store.elements || [];
    const elementMap = new Map(existingElements.map((el) => [String(el.id), el]));

    let createdCount = 0;
    let modifiedCount = 0;
    let deletedCount = 0;

    const createdNodePosMap = new Map(); 

    operations.forEach((op, index) => {
      const type = (op.type || 'create').toLowerCase();
      const objType = (op.object || 'rect').toLowerCase();
      const targetId = String(op.targetId || op.id || '');

      // 1. CREATE
      if (type === 'create') {
        const id = op.id ? String(op.id) : `ai_el_${Date.now()}_${index}`;
        const posX = typeof op.x === 'number' ? op.x : 140 + (index % 3) * 200;
        const posY = typeof op.y === 'number' ? op.y : 140 + Math.floor(index / 3) * 160;
        const width = typeof op.width === 'number' ? op.width : (objType === 'sticky' ? 160 : 180);
        const height = typeof op.height === 'number' ? op.height : (objType === 'sticky' ? 160 : 90);

        let canvasType = 'rect';
        if (objType === 'sticky') canvasType = 'sticky';
        else if (objType === 'circle' || objType === 'ellipse') canvasType = 'circle';
        else if (objType === 'text') canvasType = 'text';
        else if (objType === 'arrow' || objType === 'line') canvasType = 'arrow';
        else if (['database', 'server', 'cloud', 'frame'].includes(objType)) canvasType = 'rect';

        const strokeColor = resolveColor(op.color || '#6D5EF7');
        const fillColor = resolveColor(op.bgColor || (canvasType === 'sticky' ? 'yellow' : 'purple'), true);

        const newElement = {
          id,
          type: canvasType,
          x: posX,
          y: posY,
          width,
          height,
          data: {
            text: op.text || op.label || (objType.toUpperCase() + ' ' + (index + 1)),
            content: op.text || op.label || '',
            strokeColor,
            fillColor,
            bgColor: fillColor,
            textColor: canvasType === 'sticky' ? '#1E293B' : '#0F0F1A',
            fontSize: op.fontSize || 14,
            borderRadius: 10,
            iconType: ['database', 'server', 'cloud'].includes(objType) ? objType : undefined,
          },
        };

        store.upsertElement(newElement);
        emitElementUpdate?.(newElement);
        createdNodePosMap.set(id, { x: posX, y: posY, width, height });
        createdCount++;
      }

      // 2. MODIFY
      else if (type === 'modify') {
        const targets = targetId ? [targetId] : selectedElementIds;
        targets.forEach((tId) => {
          const existing = store.elements.find((e) => String(e.id) === String(tId));
          if (existing) {
            const updated = {
              ...existing,
              x: typeof op.x === 'number' ? op.x : existing.x,
              y: typeof op.y === 'number' ? op.y : existing.y,
              width: typeof op.width === 'number' ? op.width : existing.width,
              height: typeof op.height === 'number' ? op.height : existing.height,
              data: {
                ...existing.data,
                text: op.text !== undefined ? op.text : existing.data?.text,
                strokeColor: op.color ? resolveColor(op.color) : existing.data?.strokeColor,
                fillColor: op.bgColor ? resolveColor(op.bgColor, true) : existing.data?.fillColor,
                bgColor: op.bgColor ? resolveColor(op.bgColor, true) : existing.data?.bgColor,
                fontSize: op.fontSize || existing.data?.fontSize,
              },
            };
            store.upsertElement(updated);
            emitElementUpdate?.(updated);
            modifiedCount++;
          }
        });
      }

      // 3. DELETE
      else if (type === 'delete') {
        const idsToDelete = targetId ? [targetId] : selectedElementIds;
        if (idsToDelete.length > 0) {
          store.deleteElements(idsToDelete);
          emitElementDelete?.(idsToDelete);
          deletedCount += idsToDelete.length;
        }
      }

      // 4. CONNECT
      else if (type === 'connect' && op.from && op.to) {
        const fromPos = createdNodePosMap.get(String(op.from)) || elementMap.get(String(op.from));
        const toPos = createdNodePosMap.get(String(op.to)) || elementMap.get(String(op.to));

        const startX = fromPos ? fromPos.x + (fromPos.width || 120) : 100;
        const startY = fromPos ? fromPos.y + (fromPos.height || 80) / 2 : 100;
        const endX = toPos ? toPos.x : 250;
        const endY = toPos ? toPos.y + (toPos.height || 80) / 2 : 100;

        const connectorEl = {
          id: `conn_${Date.now()}_${index}`,
          type: 'arrow',
          x: startX,
          y: startY,
          width: endX - startX,
          height: endY - startY,
          from: String(op.from),
          to: String(op.to),
          data: {
            text: op.label || op.text || '',
            strokeColor: resolveColor(op.color || '#6D5EF7'),
            strokeWidth: 2,
          },
        };

        store.upsertElement(connectorEl);
        emitElementUpdate?.(connectorEl);
        createdCount++;
      }

      // 5. ALIGN / ORGANIZE
      else if (type === 'align') {
        const idsToAlign = selectedElementIds.length > 1 ? selectedElementIds : store.elements.map((e) => e.id);
        const targetElements = store.elements.filter((e) => idsToAlign.includes(e.id));

        if (targetElements.length > 1) {
          const instruction = op.instruction || 'align-left';
          let minX = Math.min(...targetElements.map((e) => e.x));

          targetElements.forEach((el, i) => {
            let newX = el.x;
            let newY = el.y;

            if (instruction === 'align-left') newX = minX;
            else if (instruction === 'distribute-horizontal') newX = minX + i * 200;

            const aligned = { ...el, x: newX, y: newY };
            store.upsertElement(aligned);
            emitElementUpdate?.(aligned);
            modifiedCount++;
          });
        }
      }
    });

    return { created: createdCount, modified: modifiedCount, deleted: deletedCount };
  },
};
