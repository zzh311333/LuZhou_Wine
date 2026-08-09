import { defineStore } from 'pinia'
import MarkdownIt from 'markdown-it'
import Fuse from 'fuse.js'
import { categories as staticCategories } from '../content/categories'
import { quizQuestions as staticQuiz } from '../content/quiz'

// 初始化 markdown 渲染器（禁用原始 HTML，防止 XSS）
const md = new MarkdownIt({ html: false, linkify: true })

// 加载 src/content/articles/ 下所有 .md 文章（以纯文本形式，供静态兜底使用）
const articleFiles = import.meta.glob('../content/articles/*.md', {
  query: '?raw',
  import: 'default',
})

// 后端 API 基础地址（开发环境走 Vite 代理 /api；公网静态站无后端时自动兜底）
const API_BASE = import.meta.env.VITE_API_BASE || '/api'

// 解析 frontmatter（--- 之间的元信息）与正文
function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    return { meta: {}, content: raw }
  }
  const meta = {}
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    meta[key] = line.slice(idx + 1).trim().replace(/^"(.*)"$/, '$1')
  }
  return { meta, content: match[2] }
}

export const useContentStore = defineStore('content', {
  state: () => ({
    articles: [],
    categories: [],
    quizQuestions: [],
    loaded: false,
    loading: false,
    error: '',
    source: '', // 'api'（后端实时）| 'static'（打包内容兜底）
  }),

  getters: {
    // 按分类获取文章
    articlesByCategory: (state) => (categoryId) =>
      state.articles.filter((a) => a.category === categoryId),

    // 首页展示的最新文章
    latestArticles: (state) => (limit = 6) =>
      [...state.articles].sort((a, b) => b.id - a.id).slice(0, limit),

    // 每篇文章所在分类的名称与图标
    categoryMap: (state) => {
      const map = {}
      for (const c of state.categories) {
        map[c.id] = c
      }
      return map
    },
  },

  actions: {
    // 统一写入内容并初始化搜索
    setContent(articles, categories, quiz) {
      this.articles = articles.map((a) => ({ ...a, html: md.render(a.content) }))
      this.categories = categories
      this.quizQuestions = quiz
      this.fuse = new Fuse(this.articles, {
        keys: ['title', 'summary', 'content'],
        threshold: 0.4,
        ignoreLocation: true,
      })
    },

    // 先尝试从后端 API 加载，失败则回退到打包的静态内容
    async load() {
      if (this.loaded || this.loading) return
      this.loading = true
      try {
        const ok = await this.tryLoadFromApi()
        if (!ok) {
          await this.loadFromStatic()
        }
        this.loaded = true
      } finally {
        this.loading = false
      }
    },

    // 后端 API 加载（本地开发环境后端运行时会成功）
    async tryLoadFromApi() {
      try {
        const [articlesRes, categoriesRes, quizRes] = await Promise.all([
          fetch(`${API_BASE}/articles`),
          fetch(`${API_BASE}/categories`),
          fetch(`${API_BASE}/quiz`),
        ])
        if (!articlesRes.ok || !categoriesRes.ok || !quizRes.ok) {
          throw new Error('后端数据不可用')
        }
        const [articles, categories, quiz] = await Promise.all([
          articlesRes.json(),
          categoriesRes.json(),
          quizRes.json(),
        ])
        this.setContent(articles, categories, quiz)
        this.source = 'api'
        this.error = ''
        return true
      } catch (err) {
        console.warn('[store] 后端不可用，使用打包内容兜底:', err.message)
        return false
      }
    },

    // 静态内容兜底（公网部署：内容随构建打包，无需后端）
    async loadFromStatic() {
      const results = []
      for (const path of Object.keys(articleFiles)) {
        const raw = await articleFiles[path]()
        const { meta, content } = parseFrontmatter(raw)
        if (!meta.id) continue
        results.push({
          id: Number(meta.id),
          title: meta.title || '未命名文章',
          category: meta.category || 'history',
          date: meta.date || '',
          source: meta.source || '',
          summary: meta.summary || '',
          content,
        })
      }
      results.sort((a, b) => a.id - b.id)
      this.setContent(results, staticCategories, staticQuiz)
      this.source = 'static'
      this.error = ''
    },

    // 重新拉取文章（后台编辑后调用，让前台即时刷新；仅本地有后端时生效）
    async refreshArticles() {
      const res = await fetch(`${API_BASE}/articles`)
      if (!res.ok) throw new Error('刷新文章失败')
      const articles = await res.json()
      this.articles = articles.map((a) => ({ ...a, html: md.render(a.content) }))
      this.fuse = new Fuse(this.articles, {
        keys: ['title', 'summary', 'content'],
        threshold: 0.4,
        ignoreLocation: true,
      })
    },

    async refreshCategories() {
      const res = await fetch(`${API_BASE}/categories`)
      if (!res.ok) throw new Error('刷新分类失败')
      this.categories = await res.json()
    },

    async refreshQuiz() {
      const res = await fetch(`${API_BASE}/quiz`)
      if (!res.ok) throw new Error('刷新题目失败')
      this.quizQuestions = await res.json()
    },

    search(keyword) {
      if (!this.fuse) return []
      if (!keyword) return this.articles
      return this.fuse.search(keyword).map((r) => r.item)
    },
  },
})
