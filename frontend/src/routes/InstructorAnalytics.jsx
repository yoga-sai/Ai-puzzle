export default function InstructorAnalytics() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border rounded">Students</div>
        <div className="p-4 bg-white border rounded">Completed</div>
        <div className="p-4 bg-white border rounded">Average score</div>
      </div>
    </div>
  )
}