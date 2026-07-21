import { useState } from 'react'

export function ChatInput({ onSend }) {
  const [value, setValue] = useState('')

  function submit(event) {
    event.preventDefault()
    const text = value.trim()

    if (text) {
      onSend?.(text)
      setValue('')
    }
  }

  return (
    <form className="chat-input" onSubmit={submit}>
      <input value={value} onChange={(event) => setValue(event.target.value)} />
      <button type="submit">Send</button>
    </form>
  )
}

export default ChatInput
