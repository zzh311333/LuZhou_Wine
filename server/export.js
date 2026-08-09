// 发布同步脚本：把本地 SQLite 数据库里的内容（文章/分类/问答）
// 写回 src/content/，这样下次构建（vite build）就能把后台改动打包进公网站点。
//
// 用法：node server/export.js
// （或 npm run publish —— 导出 + 构建一条龙）

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import db from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.join(__dirname, '..', 'src', 'content')
const ARTICLES_DIR = path.join(CONTENT_DIR, 'articles')

// 把中文标题转成安全的文件名片段（去掉非法字符）
function slugify(title) {
  return String(title)
    .replace(/[：:/\?*"<>|\\\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ===== 1. 导出文章 → src/content/articles/*.md =====
function exportArticles() {
  const articles = db.prepare('SELECT * FROM articles ORDER BY id').all()

  // 先写入/覆盖所有文章，最后再清理多余旧文件。
  // 注意：不要"先清空再写入"——在开发服务器监控下，同一目录里
  // 快速"删除+重建同名文件"会偶发丢失文件（Windows 文件系统 + 文件监听竞态）。
  const expected = new Set()
  for (const a of articles) {
    const file = path.join(ARTICLES_DIR, `${String(a.id).padStart(3, '0')}-${slugify(a.title)}.md`)
    expected.add(file)
    const fm = [
      '---',
      `id: ${a.id}`,
      `title: ${a.title}`,
      `category: ${a.category}`,
      `date: ${a.date || ''}`,
      `source: ${a.source || ''}`,
      `summary: ${a.summary || ''}`,
      '---',
      '',
    ].join('\n')
    fs.writeFileSync(file, fm + (a.content || '') + '\n', 'utf-8')
  }

  // 清理残留：不在期望列表里的 .md 删除
  for (const f of fs.readdirSync(ARTICLES_DIR)) {
    const full = path.join(ARTICLES_DIR, f)
    if (f.endsWith('.md') && !expected.has(full)) fs.rmSync(full)
  }
  return articles.length
}

// ===== 2. 导出分类 → src/content/categories.js =====
function exportCategories() {
  const rows = db.prepare('SELECT * FROM categories ORDER BY id').all()
  const items = rows.map((c) => `  {\n    id: ${JSON.stringify(c.id)},\n    name: ${JSON.stringify(c.name)},\n    description: ${JSON.stringify(c.description || '')},\n    icon: ${JSON.stringify(c.icon || '')}\n  }`)

  const content = [
    '// 泸州老窖科普平台 —— 分类定义',
    '// 本文件由 server/export.js 从本地数据库导出，请勿手动编辑',
    '',
    'export const categories = [',
    items.join(',\n'),
    ']',
    '',
    'export function getCategoryName(id) {',
    '  const c = categories.find((c) => c.id === id)',
    '  return c ? c.name : id',
    '}',
    '',
    'export function getCategoryById(id) {',
    '  return categories.find((c) => c.id === id)',
    '}',
    '',
  ].join('\n')
  fs.writeFileSync(path.join(CONTENT_DIR, 'categories.js'), content, 'utf-8')
  return rows.length
}

// ===== 3. 导出问答 → src/content/quiz.js =====
function exportQuiz() {
  const rows = db.prepare('SELECT * FROM quiz ORDER BY id').all()
  const items = rows.map((q) => {
    const options = JSON.parse(q.options)
    return [
      '  {',
      `    question: ${JSON.stringify(q.question)},`,
      `    options: ${JSON.stringify(options)},`,
      `    answer: ${q.answer},`,
      `    explanation: ${JSON.stringify(q.explanation || '')}`,
      '  }',
    ].join('\n')
  })

  const content = [
    '// 泸州老窖科普平台 —— 知识问答题库',
    '// 本文件由 server/export.js 从本地数据库导出，请勿手动编辑',
    '// 每题：question 题目、options 选项数组、answer 正确选项下标、explanation 解析',
    '',
    'export const quizQuestions = [',
    items.join(',\n'),
    ']',
    '',
  ].join('\n')
  fs.writeFileSync(path.join(CONTENT_DIR, 'quiz.js'), content, 'utf-8')
  return rows.length
}

// ===== 执行 =====
const nArticles = exportArticles()
const nCategories = exportCategories()
const nQuiz = exportQuiz()

console.log('✅ 已从本地数据库导出到 src/content/：')
console.log(`   文章 ${nArticles} 篇 → src/content/articles/*.md`)
console.log(`   分类 ${nCategories} 个 → src/content/categories.js`)
console.log(`   问答 ${nQuiz} 题 → src/content/quiz.js`)
console.log('下一步：npm run build 重新构建，然后重新部署即可更新公网。')
