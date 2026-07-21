import { Routes, Route } from 'react-router-dom';
import Landing from '../pages/Landing.jsx';
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import Whiteboard from '../pages/Whiteboard.jsx';
import Profile from '../pages/Profile.jsx';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/boards/:boardId" element={<Whiteboard />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}
