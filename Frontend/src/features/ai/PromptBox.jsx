export function PromptBox({ value, onChange, onSubmit }) {
  return (
    <form className="ai-prompt-box" onSubmit={onSubmit}>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ask AI to help with this board"
      />
      <button type="submit">Ask</button>
    </form>
  )
}

export default PromptBox
