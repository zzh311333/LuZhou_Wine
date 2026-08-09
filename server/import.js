// 内容同步脚本：把内容源文件（src/content/）里的"新增"内容写进本地数据库。
// 已存在的记录会跳过，不会覆盖你在后台做过的修改。
//
// 用法：node server/import.js
// 为什么要用：公网发布前会跑 server/export.js，它会把 src/content/ 清空重建；
// 如果新写的文章 / 新题目没进数据库，export 时会被当成"已删除"而丢掉。
// 所以顺序是：改好 src/content/ 里的文件 → node server/import.js（进库）→ node server/export.js（重建规范文件）。

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import db from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.join(__dirname, '..', 'src', 'content')
const ARTICLES_DIR = path.join(CONTENT_DIR, 'articles')

// 解析 Markdown frontmatter（与 db.js 保持一致）
function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { meta: {}, content: raw }
  const meta = {}
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    meta[key] = line.slice(idx + 1).trim().replace(/^"(.*)"$/, '$1')
  }
  return { meta, content: match[2] }
}

const hasCategory = db.prepare('SELECT COUNT(*) AS c FROM categories WHERE id = ?')
const hasArticle = db.prepare('SELECT COUNT(*) AS c FROM articles WHERE title = ?')
const hasQuiz = db.prepare('SELECT COUNT(*) AS c FROM quiz WHERE question = ?')

// ===== 1. 分类 =====
async function importCategories() {
  const { categories } = await import(pathToFileURL(path.join(CONTENT_DIR, 'categories.js')))
  const insert = db.prepare('INSERT INTO categories (id, name, description, icon) VALUES (?, ?, ?, ?)')
  let added = 0
  for (const c of categories) {
    if (hasCategory.get(c.id).c === 0) {
      insert.run(c.id, c.name, c.description, c.icon)
      added++
    }
  }
  return { total: categories.length, added }
}

// ===== 2. 文章 =====
function importArticles() {
  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.md'))
  const insert = db.prepare(
    'INSERT INTO articles (title, category, date, source, summary, content) VALUES (?, ?, ?, ?, ?, ?)'
  )
  let added = 0
  for (const file of files) {
    const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf-8')
    const { meta, content } = parseFrontmatter(raw)
    if (!meta.title) continue
    if (hasArticle.get(meta.title).c === 0) {
      insert.run(meta.title, meta.category, meta.date, meta.source, meta.summary, content)
      added++
    }
  }
  return { total: files.length, added }
}

// ===== 3. 问答 =====
async function importQuiz() {
  const { quizQuestions } = await import(pathToFileURL(path.join(CONTENT_DIR, 'quiz.js')))
  const insert = db.prepare(
    'INSERT INTO quiz (question, options, answer, explanation) VALUES (?, ?, ?, ?)'
  )
  let added = 0
  for (const q of quizQuestions) {
    if (hasQuiz.get(q.question).c === 0) {
      insert.run(q.question, JSON.stringify(q.options), q.answer, q.explanation)
      added++
    }
  }
  return { total: quizQuestions.length, added }
}

const cats = await importCategories()
const arts = importArticles()
const quiz = await importQuiz()

console.log('✅ 已把内容源文件中的新增内容写入数据库：')
console.log(`   分类：源 ${cats.total} 个，新增 ${cats.added} 个`)
console.log(`   文章：源 ${arts.total} 篇，新增 ${arts.added} 篇`)
console.log(`   问答：源 ${quiz.total} 题，新增 ${quiz.added} 题`)
console.log('下一步（发布时）：node server/export.js 重新生成内容源文件。')
