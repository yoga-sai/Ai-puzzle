import { Link, NavLink } from "react-router-dom"

export default function NavBar() {
  return (
    <header className="bg-white shadow">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-semibold text-primary">Parsons Puzzle</Link>
        <nav className="flex items-center gap-4 text-sm">
          <NavLink to="/" className={({isActive}) => isActive ? "text-primary" : "text-gray-700"}>Home</NavLink>
          <NavLink to="/student/dashboard" className={({isActive}) => isActive ? "text-primary" : "text-gray-700"}>Student</NavLink>
          <NavLink to="/instructor/dashboard" className={({isActive}) => isActive ? "text-primary" : "text-gray-700"}>Instructor</NavLink>
          <NavLink to="/login" className={({isActive}) => isActive ? "text-primary" : "text-gray-700"}>Login</NavLink>
          <NavLink to="/register" className={({isActive}) => isActive ? "text-primary" : "text-gray-700"}>Register</NavLink>
        </nav>
      </div>
    </header>
  )
}