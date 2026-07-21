export function SidePanel({ children, title = 'Board' }) {
  return (
    <aside className="board-side-panel">
      <h2>{title}</h2>
      {children}
    </aside>
  )
}

export default SidePanel
