import Arrow from './Arrow.jsx'
import Circle from './Circle.jsx'
import Export from './Export.jsx'
import Image from './Image.jsx'
import Pen from './Pen.jsx'
import Rectangle from './Rectangle.jsx'
import Redo from './Redo.jsx'
import StickyNote from './StickyNote.jsx'
import Text from './Text.jsx'
import Undo from './Undo.jsx'

const tools = [Pen, Rectangle, Circle, Arrow, Text, StickyNote, Image, Undo, Redo, Export]

export function Toolbar({ onToolSelect }) {
  return (
    <nav aria-label="Whiteboard tools" className="toolbar">
      {tools.map((Tool) => (
        <Tool key={Tool.name} onClick={() => onToolSelect?.(Tool.name)} />
      ))}
    </nav>
  )
}

export default Toolbar
