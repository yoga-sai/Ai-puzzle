import { findByEmail, createUser } from "../../repositories/users.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export async function loginController(req, res) {
  const { email, password, role } = req.body
  if (!email || !password || !role) return res.status(400).json({ message: "invalid" })
  const u = await findByEmail(email)
  if (!u || u.role !== role) return res.status(401).json({ message: "invalid" })
  const ok = bcrypt.compareSync(password, u.password_hash)
  if (!ok) return res.status(401).json({ message: "invalid" })
  const token = jwt.sign({ sub: u.id, role: u.role, email: u.email }, process.env.JWT_SECRET || "dev_secret", { expiresIn: "1h" })
  return res.json({ token, user: { id: u.id, email: u.email, role: u.role, name: u.name } })
}

export async function registerController(req, res) {
  const { email, password, name, role } = req.body
  if (!email || !password || !name || !role) return res.status(400).json({ message: "invalid" })
  const existing = await findByEmail(email)
  if (existing) return res.status(409).json({ message: "exists" })
  const user = await createUser({ email, password, name, role })
  return res.status(201).json(user)
}