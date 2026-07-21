import Message from './Message.jsx'

export function ChatWindow({ messages = [] }) {
  return (
    <section aria-label="Board chat" className="chat-window">
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
    </section>
  )
}

export default ChatWindow
