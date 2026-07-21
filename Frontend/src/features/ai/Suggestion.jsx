export function Suggestion({ children, onSelect }) {
  return (
    <button type="button" className="ai-suggestion" onClick={onSelect}>
      {children}
    </button>
  )
}

export default Suggestion
