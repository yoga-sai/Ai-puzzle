import { useMemo, useState } from "react"
import { useParams } from "react-router-dom"

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function PuzzleSolving() {
  const { id } = useParams()
  const segments = useMemo(() => [
    "initialize sum to 0",
    "for each element in array",
    "add element to sum",
    "return sum"
  ], [])
  const [order, setOrder] = useState(shuffle(segments))
  const [drag, setDrag] = useState(null)
  const [result, setResult] = useState(null)

  const onDragStart = (s) => setDrag(s)
  const onDrop = (target) => {
    const from = order.indexOf(drag)
    const to = order.indexOf(target)
    const next = [...order]
    next.splice(from, 1)
    next.splice(to, 0, drag)
    setOrder(next)
    setDrag(null)
  }

  const submit = () => {
    const correct = JSON.stringify(order) === JSON.stringify(segments)
    setResult(correct ? { correct: true, score: 100 } : { correct: false, score: 0 })
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Puzzle {id}</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="text-sm text-gray-600 mb-2">Drag to reorder</div>
          <div className="space-y-2">
            {order.map(s => (
              <div
                key={s}
                draggable
                onDragStart={() => onDragStart(s)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(s)}
                className="p-3 rounded border bg-white"
              >
                {s}
              </div>
            ))}
          </div>
          <button onClick={submit} className="mt-4 px-3 py-2 rounded bg-primary text-white">Submit</button>
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-2">Feedback</div>
          {result && (
            <div className={result.correct ? "text-success" : "text-red-600"}>
              {result.correct ? "Great job! Your solution is correct." : "Try again."}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}