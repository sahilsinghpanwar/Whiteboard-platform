export function Cursor({ name, x = 0, y = 0 }) {
  return (
    <span className="collaboration-cursor" style={{ left: x, top: y }}>
      {name}
    </span>
  )
}

export default Cursor
