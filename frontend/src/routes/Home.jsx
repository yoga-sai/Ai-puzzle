import { Link } from "react-router-dom"

export default function Home() {
  return (
    <section className="text-center py-16">
      <h1 className="text-4xl font-bold mb-4">Learn algorithmic thinking with Parsons Puzzles</h1>
      <p className="text-gray-600 mb-8">Reorder pseudocode segments to form correct solutions.</p>
      <div className="flex gap-4 justify-center">
        <Link to="/student/dashboard" className="px-5 py-2 rounded bg-primary text-white">For Students</Link>
        <Link to="/instructor/dashboard" className="px-5 py-2 rounded bg-gray-800 text-white">For Instructors</Link>
      </div>
    </section>
  )
}