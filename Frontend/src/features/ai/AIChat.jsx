import { useState } from 'react'
import PromptBox from './PromptBox.jsx'

export function AIChat({ onPrompt }) {
  const [prompt, setPrompt] = useState('')

  function submit(event) {
    event.preventDefault()
    onPrompt?.(prompt)
    setPrompt('')
  }

  return <PromptBox value={prompt} onChange={setPrompt} onSubmit={submit} />
}

export default AIChat
