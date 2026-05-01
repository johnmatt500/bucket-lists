import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import Signup from './pages/Signup'
import Login from './pages/Login'
import Buckets from './pages/Buckets'
import Invite from './pages/Invite'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/buckets" element={<Buckets />} />
        <Route path="/invite/:token" element={<Invite />} />
      </Routes>
    </BrowserRouter>
  )
}
