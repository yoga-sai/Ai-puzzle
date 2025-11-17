import bcrypt from "bcryptjs"
import crypto from "crypto"
import { db } from "../db/connection.js"

export async function findByEmail(email) {
  const row = await db.get("SELECT id, email, password_hash, name, role FROM users WHERE email = ?", [email])
  return row || null
}

export async function createUser({ email, password, name, role }) {
  const id = crypto.randomUUID()
  const password_hash = bcrypt.hashSync(password, 12)
  await db.run("INSERT INTO users(id, email, password_hash, name, role) VALUES(?,?,?,?,?)", [id, email, password_hash, name, role])
  return { id, email, name, role }
}