import "dotenv/config"
import app from "./setup/app.js"
import { ensureSchema } from "./db/schema.js"

const port = process.env.PORT || 3001
await ensureSchema()
app.listen(port, () => {
	console.log(`Server listening on port ${port}`)
})