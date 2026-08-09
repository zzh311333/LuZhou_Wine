<script setup>
import { useRouter } from 'vue-router'
import { useContentStore } from '../stores/content'

const router = useRouter()
const store = useContentStore()
const articleCount = store.articles.length
</script>

<template>
  <div class="about-wrap">
    <h1 class="page-title">关于本站</h1>

    <el-card shadow="never" class="about-card">
      <div class="about-hero">
        <span class="about-logo">🍶</span>
        <h2>泸州老窖科普知识平台</h2>
        <p class="about-slogan">一杯酒里，藏着700年的中国</p>
      </div>

      <div class="about-section">
        <h3>🎯 我们是谁</h3>
        <p>
          这是一个面向普通群众的<b>泸州老窖科普平台</b>。我们希望通过通俗易懂的文字，
          让更多人了解这家"浓香鼻祖"背后的历史、文化、产品与现代创新。
        </p>
      </div>

      <div class="about-section">
        <h3>📚 你能在这里看到什么</h3>
        <ul class="feature-list">
          <li v-for="c in store.categories" :key="c.id">
            <b>{{ c.icon }} {{ c.name }}</b> —— {{ c.description }}
          </li>
          <li><b>🧠 知识问答</b> —— 通过小测验检验你的白酒知识</li>
          <li><b>🔍 全文搜索</b> —— 快速找到你关心的内容</li>
        </ul>
      </div>

      <div class="about-section">
        <h3>📝 内容说明</h3>
        <p>
          本站目前收录 {{ articleCount }} 篇科普文章、{{ store.quizQuestions.length }} 道知识问答。
          全部内容均基于公开资料（泸州老窖官网、百度百科、主流媒体及券商研报等）整理撰写，
          仅作科普与学习用途，不构成任何投资建议。
        </p>
      </div>

      <div class="about-section">
        <h3>🚀 平台背后的技术</h3>
        <p>
          本站采用 <b>Vue 3 + Vite</b> 构建，搭配 Element Plus 组件库；
          后台管理基于 <b>Express + SQLite</b> 实现内容持久化。
        </p>
        <p class="ai-note">
          🤖 <b>人工智能辅助搭建</b>：本平台从整体架构设计、页面与后台开发、
          科普内容调研撰写到问答出题，均在 AI 助手的辅助下完成，
          再经人工核对与优化。
        </p>
      </div>

      <div class="about-actions">
        <el-button type="danger" size="large" round @click="router.push('/')">
          去首页逛逛 →
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.page-title {
  font-size: 26px;
  margin: 0 0 20px;
}

.about-card {
  border-radius: 14px;
}

.about-hero {
  text-align: center;
  padding: 30px 0 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 24px;
}

.about-logo {
  font-size: 52px;
}

.about-hero h2 {
  font-size: 26px;
  margin: 10px 0 6px;
}

.about-slogan {
  color: #a52626;
  font-weight: 600;
}

.about-section {
  margin-bottom: 24px;
}

.about-section h3 {
  font-size: 17px;
  margin: 0 0 10px;
}

.about-section p {
  font-size: 15px;
  line-height: 1.9;
  color: var(--el-text-color-regular);
  margin: 0;
}

.about-section p.ai-note {
  margin-top: 10px;
  padding: 10px 14px;
  background: #fdf6f0;
  border-left: 4px solid #a52626;
  border-radius: 0 8px 8px 0;
}

.feature-list {
  padding-left: 1.3em;
  line-height: 2;
  color: var(--el-text-color-regular);
  font-size: 15px;
}

.about-actions {
  text-align: center;
  padding-top: 10px;
}
</style>
