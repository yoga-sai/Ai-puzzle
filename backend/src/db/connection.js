import sqlite3 from "sqlite3"
import path from "path"
import fs from "fs"

const dbPath = process.env.DB_PATH || path.join(process.cwd(), "data", "puzzle.db")
fs.mkdirSync(path.dirname(dbPath), { recursive: true })

const sqlite = sqlite3.verbose()
const rawDb = new sqlite.Database(dbPath)

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    rawDb.run(sql, params, function (err) {
      if (err) return reject(err)
      resolve({ lastID: this.lastID, changes: this.changes })
    })
  })
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    rawDb.get(sql, params, (err, row) => {
      if (err) return reject(err)
      resolve(row)
    })
  })
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    rawDb.all(sql, params, (err, rows) => {
      if (err) return reject(err)
      resolve(rows)
    })
  })
}

function exec(sql) {
  return new Promise((resolve, reject) => {
    rawDb.exec(sql, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

export const db = { run, get, all, exec, raw: rawDb }

export function close() {
  return new Promise((resolve, reject) => rawDb.close((err) => (err ? reject(err) : resolve())))
}