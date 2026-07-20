/**
 * @typedef {'owner' | 'editor' | 'viewer'} MemberRole
 *
 * @typedef {Object} BoardMember
 * @property {import('mongoose').Types.ObjectId} userId
 * @property {MemberRole} role
 * @property {Date} joinedAt
 *
 * @typedef {'rectangle' | 'ellipse' | 'diamond' | 'triangle'} ShapeType
 * @typedef {'pen' | 'eraser'} DrawingTool
 * @typedef {'sticky' | 'text'} TextElementType
 * @typedef {'arrow' | 'line'} ConnectorType
 * @typedef {'image'} MediaType
 *
 * @typedef {Object} BaseElement
 * @property {string} id          — client-generated uuid (stable across socket events)
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 * @property {number} rotation    — degrees
 * @property {number} zIndex
 * @property {string} createdBy   — userId string
 * @property {string} updatedBy
 *
 * @typedef {BaseElement & { type: ShapeType, fill: string, stroke: string, strokeWidth: number }} ShapeElement
 * @typedef {BaseElement & { type: TextElementType, content: string, fontSize: number, fontFamily: string, color: string, bold: boolean, italic: boolean }} TextElement
 * @typedef {BaseElement & { type: ConnectorType, points: number[], stroke: string, strokeWidth: number }} ConnectorElement
 * @typedef {BaseElement & { type: MediaType, url: string, alt: string }} ImageElement
 *
 * @typedef {ShapeElement | TextElement | ConnectorElement | ImageElement} BoardElement
 *
 * @typedef {Object} CanvasState
 * @property {BoardElement[]} elements
 * @property {string} background     — hex color or 'transparent'
 * @property {{ x: number, y: number, zoom: number }} viewport
 *
 * @typedef {Object} BoardDocument
 * @property {import('mongoose').Types.ObjectId} _id
 * @property {string} title
 * @property {string} [description]
 * @property {import('mongoose').Types.ObjectId} owner
 * @property {BoardMember[]} members
 * @property {CanvasState} canvas
 * @property {boolean} isPublic
 * @property {string} [thumbnail]
 * @property {Date} lastActivityAt
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */
