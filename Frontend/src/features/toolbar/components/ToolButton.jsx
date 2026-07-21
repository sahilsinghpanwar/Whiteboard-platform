export function ToolButton({ label, onClick }) {
  return (
    <button type="button" aria-label={label} onClick={onClick}>
      {label}
    </button>
  )
}
