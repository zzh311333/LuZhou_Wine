import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'data.db')
const CONTENT_DIR = path.join(__dirname, '..', 'src', 'content')
const ARTICLES_DIR = path.join(CONTENT_DIR, 'articles')

// 打开数据库（文件型，自动创建）
const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// ===== 建表 =====
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    icon        TEXT
  );

  CREATE TABLE IF NOT EXISTS articles (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    category    TEXT NOT NULL,
    date        TEXT,
    source      TEXT,
    summary     TEXT,
    content     TEXT NOT NULL,
    FOREIGN KEY (category) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS quiz (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    question    TEXT NOT NULL,
    options     TEXT NOT NULL,   -- JSON 数组
    answer      INTEGER NOT NULL,
    explanation TEXT
  );

  CREATE TABLE IF NOT EXISTS admin (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );
`)

// ===== 解析 Markdown frontmatter =====
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

// ===== 首次启动时导入初始内容 =====
export async function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM articles').get().c
  if (count > 0) return false

  // 从前端 content 目录导入分类
  const categoriesModule = await import(pathToFileURL(path.join(CONTENT_DIR, 'categories.js')))
  const insertCat = db.prepare(
    'INSERT INTO categories (id, name, description, icon) VALUES (?, ?, ?, ?)'
  )
  for (const c of categoriesModule.categories) {
    insertCat.run(c.id, c.name, c.description, c.icon)
  }

  // 导入科普文章（.md 文件）
  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.md'))
  const insertArt = db.prepare(
    'INSERT INTO articles (title, category, date, source, summary, content) VALUES (?, ?, ?, ?, ?, ?)'
  )
  for (const file of files) {
    const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf-8')
    const { meta, content } = parseFrontmatter(raw)
    insertArt.run(meta.title, meta.category, meta.date, meta.source, meta.summary, content)
  }

  // 导入问答题库
  const quizModule = await import(pathToFileURL(path.join(CONTENT_DIR, 'quiz.js')))
  const insertQuiz = db.prepare(
    'INSERT INTO quiz (question, options, answer, explanation) VALUES (?, ?, ?, ?)'
  )
  for (const q of quizModule.quizQuestions) {
    insertQuiz.run(q.question, JSON.stringify(q.options), q.answer, q.explanation)
  }

  // 默认管理员账号：admin / admin123
  const passwordHash = bcrypt.hashSync('admin123', 10)
  db.prepare('INSERT INTO admin (username, password_hash) VALUES (?, ?)').run('admin', passwordHash)

  return true
}

export default db
