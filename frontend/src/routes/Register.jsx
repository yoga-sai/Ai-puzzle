import { useState } from "react"
import { env } from "../lib/env"

export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState("student")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch(`${env.apiBase}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Register failed")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Register</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="w-full border rounded px-3 py-2" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" placeholder="Full name" value={name} onChange={(e)=>setName(e.target.value)} />
        <select className="w-full border rounded px-3 py-2" value={role} onChange={(e)=>setRole(e.target.value)}>
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
        </select>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button disabled={loading} className="w-full bg-primary text-white rounded px-3 py-2">{loading ? "Loading" : "Create account"}</button>
      </form>
    </div>
  )
}