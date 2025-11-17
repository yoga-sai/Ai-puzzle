import { useState } from "react"

export default function InstructorPuzzles() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [segments, setSegments] = useState([""])

  const addSegment = () => setSegments([...segments, ""]) 
  const updateSegment = (i, v) => setSegments(segments.map((s, idx) => idx === i ? v : s))

  const submit = (e) => {
    e.preventDefault()
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold mb-4">Create puzzle</h2>
      <form onSubmit={submit} className="space-y-4">
        <input className="w-full border rounded px-3 py-2" placeholder="Title" value={title} onChange={(e)=>setTitle(e.target.value)} />
        <textarea className="w-full border rounded px-3 py-2" placeholder="Description" value={description} onChange={(e)=>setDescription(e.target.value)} />
        <div className="space-y-2">
          {segments.map((s, i) => (
            <input key={i} className="w-full border rounded px-3 py-2" placeholder={`Segment ${i+1}`} value={s} onChange={(e)=>updateSegment(i, e.target.value)} />
          ))}
          <button type="button" onClick={addSegment} className="px-3 py-1 rounded bg-gray-200">Add segment</button>
        </div>
        <button className="px-3 py-2 rounded bg-primary text-white">Publish</button>
      </form>
    </div>
  )
}