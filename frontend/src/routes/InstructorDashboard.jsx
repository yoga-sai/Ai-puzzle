import { Link } from "react-router-dom"

export default function InstructorDashboard() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Instructor dashboard</h2>
      <div className="flex gap-3">
        <Link to="/instructor/puzzles" className="px-3 py-2 rounded bg-primary text-white">Manage puzzles</Link>
        <Link to="/instructor/analytics" className="px-3 py-2 rounded bg-gray-800 text-white">Analytics</Link>
      </div>
    </div>
  )
}