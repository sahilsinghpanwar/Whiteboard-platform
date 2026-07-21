export function Presence({ users = [] }) {
  return <span aria-label={`${users.length} collaborators`}>{users.length} online</span>
}

export default Presence
