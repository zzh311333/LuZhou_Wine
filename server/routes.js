import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from './db.js'
import { signToken, authRequired } from './auth.js'

const router = Router()

// ===== 分类 =====
router.get('/categories', (req, res) => {
  const rows = db.prepare('SELECT * FROM categories ORDER BY id').all()
  res.json(rows)
})

router.post('/categories', authRequired, (req, res) => {
  const { id, name, description, icon } = req.body
  if (!id || !name) return res.status(400).json({ message: '缺少必要字段' })
  db.prepare('INSERT INTO categories (id, name, description, icon) VALUES (?, ?, ?, ?)')
    .run(id, name, description || '', icon || '📁')
  res.json({ message: '分类已创建' })
})

router.put('/categories/:id', authRequired, (req, res) => {
  const { name, description, icon } = req.body
  const result = db.prepare('UPDATE categories SET name = ?, description = ?, icon = ? WHERE id = ?')
    .run(name, description, icon, req.params.id)
  if (result.changes === 0) return res.status(404).json({ message: '分类不存在' })
  res.json({ message: '分类已更新' })
})

router.delete('/categories/:id', authRequired, (req, res) => {
  const inUse = db.prepare('SELECT COUNT(*) AS c FROM articles WHERE category = ?')
    .get(req.params.id).c
  if (inUse > 0) return res.status(400).json({ message: '该分类下还有文章，无法删除' })
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id)
  res.json({ message: '分类已删除' })
})

// ===== 文章 =====
function serializeArticle(row) {
  const cat = db.prepare('SELECT name, icon FROM categories WHERE id = ?').get(row.category)
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    categoryName: cat ? cat.name : row.category,
    categoryIcon: cat ? cat.icon : '📁',
    date: row.date,
    source: row.source,
    summary: row.summary,
    content: row.content,
  }
}

router.get('/articles', (req, res) => {
  const rows = db.prepare('SELECT * FROM articles ORDER BY id').all()
  res.json(rows.map(serializeArticle))
})

router.get('/articles/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ message: '文章不存在' })
  res.json(serializeArticle(row))
})

router.post('/articles', authRequired, (req, res) => {
  const { title, category, date, source, summary, content } = req.body
  if (!title || !category || !content) {
    return res.status(400).json({ message: '标题、分类、正文为必填项' })
  }
  const info = db.prepare(
    'INSERT INTO articles (title, category, date, source, summary, content) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    title, category,
    date || new Date().toISOString().slice(0, 10),
    source || '', summary || '', content
  )
  const created = db.prepare('SELECT * FROM articles WHERE id = ?').get(info.lastInsertRowid)
  res.json(serializeArticle(created))
})

router.put('/articles/:id', authRequired, (req, res) => {
  const { title, category, date, source, summary, content } = req.body
  const result = db.prepare(
    `UPDATE articles SET title = ?, category = ?, date = ?, source = ?, summary = ?, content = ? WHERE id = ?`
  ).run(title, category, date, source, summary, content, req.params.id)
  if (result.changes === 0) return res.status(404).json({ message: '文章不存在' })
  const updated = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id)
  res.json(serializeArticle(updated))
})

router.delete('/articles/:id', authRequired, (req, res) => {
  const result = db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id)
  if (result.changes === 0) return res.status(404).json({ message: '文章不存在' })
  res.json({ message: '文章已删除' })
})

// ===== 知识问答 =====
router.get('/quiz', (req, res) => {
  const rows = db.prepare('SELECT * FROM quiz ORDER BY id').all()
  res.json(rows.map((r) => ({ ...r, options: JSON.parse(r.options) })))
})

router.post('/quiz', authRequired, (req, res) => {
  const { question, options, answer, explanation } = req.body
  if (!question || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ message: '题目和至少两个选项为必填' })
  }
  const info = db.prepare(
    'INSERT INTO quiz (question, options, answer, explanation) VALUES (?, ?, ?, ?)'
  ).run(question, JSON.stringify(options), answer, explanation || '')
  res.json({ id: info.lastInsertRowid, message: '题目已创建' })
})

router.put('/quiz/:id', authRequired, (req, res) => {
  const { question, options, answer, explanation } = req.body
  const result = db.prepare(
    'UPDATE quiz SET question = ?, options = ?, answer = ?, explanation = ? WHERE id = ?'
  ).run(question, JSON.stringify(options), answer, explanation || '', req.params.id)
  if (result.changes === 0) return res.status(404).json({ message: '题目不存在' })
  res.json({ message: '题目已更新' })
})

router.delete('/quiz/:id', authRequired, (req, res) => {
  const result = db.prepare('DELETE FROM quiz WHERE id = ?').run(req.params.id)
  if (result.changes === 0) return res.status(404).json({ message: '题目不存在' })
  res.json({ message: '题目已删除' })
})

// ===== 管理员登录 =====
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ message: '请输入用户名和密码' })
  }
  const admin = db.prepare('SELECT * FROM admin WHERE username = ?').get(username)
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ message: '用户名或密码错误' })
  }
  const token = signToken({ id: admin.id, username: admin.username })
  res.json({ token, username: admin.username, message: '登录成功' })
})

// ===== 修改密码 =====
router.put('/auth/password', authRequired, (req, res) => {
  const { oldPassword, newPassword } = req.body
  const admin = db.prepare('SELECT * FROM admin WHERE id = ?').get(req.user.id)
  if (!bcrypt.compareSync(oldPassword, admin.password_hash)) {
    return res.status(400).json({ message: '原密码错误' })
  }
  const hash = bcrypt.hashSync(newPassword, 10)
  db.prepare('UPDATE admin SET password_hash = ? WHERE id = ?').run(hash, req.user.id)
  res.json({ message: '密码已修改' })
})

export default router
