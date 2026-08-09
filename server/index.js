import express from 'express'
import cors from 'cors'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import db, { seedIfEmpty } from './db.js'
import apiRoutes from './routes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

// 跨域（开发环境前端 5173 通过 Vite 代理请求，也允许直接访问）
app.use(cors())
app.use(express.json({ limit: '2mb' }))

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

// 业务路由
app.use('/api', apiRoutes)

// 生产模式：托管前端构建产物 dist/
const distPath = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  // 单页应用：未匹配的路径返回 index.html（但 /api 已在上方处理）
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
  console.log(`[server] 检测到 dist/，将托管前端构建产物`)
}

// 启动：先导入初始数据，再监听端口
async function start() {
  const seeded = await seedIfEmpty()
  if (seeded) {
    console.log('[server] 首次启动，已导入初始科普内容与默认管理员 (admin/admin123)')
  }
  app.listen(PORT, () => {
    console.log(`[server] 泸州老窖科普平台后端已启动: http://localhost:${PORT}`)
    console.log(`[server] 前台数据 API: http://localhost:${PORT}/api/articles`)
  })
}

start().catch((err) => {
  console.error('[server] 启动失败:', err)
  process.exit(1)
})
