import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import authRoutes from './routes/auth'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173', credentials: true }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
