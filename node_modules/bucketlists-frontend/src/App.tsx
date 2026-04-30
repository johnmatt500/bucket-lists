import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import Signup from './pages/Signup'
import Login from './pages/Login'
import Buckets from './pages/Buckets'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/buckets" element={<Buckets />} />
      </Routes>
    </BrowserRouter>
  )
}
