import { Outlet } from "react-router-dom"
import NavBar from "../components/NavBar"

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}