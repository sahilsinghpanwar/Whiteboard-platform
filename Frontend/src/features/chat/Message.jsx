export function Message({ message }) {
  return (
    <article className="chat-message">
      <strong>{message.author}</strong>
      <p>{message.text}</p>
    </article>
  )
}

export default Message
