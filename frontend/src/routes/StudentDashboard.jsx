import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { env } from "../lib/env"

export default function StudentDashboard() {
  const [puzzles, setPuzzles] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`${env.apiBase}/api/puzzles`)
        const data = await res.json()
        setPuzzles(data.puzzles || [])
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Available puzzles</h2>
      {loading && <div>Loading</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {puzzles.map(p => (
          <div key={p.id} className="border rounded p-4 bg-white">
            <div className="font-medium">{p.title}</div>
            <div className="text-sm text-gray-600">{p.category} • {p.difficulty}</div>
            <Link to={`/student/puzzle/${p.id}`} className="mt-3 inline-block px-3 py-1 rounded bg-primary text-white">Start</Link>
          </div>
        ))}
      </div>
    </div>
  )
}