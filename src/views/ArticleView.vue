<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContentStore } from '../stores/content'

const route = useRoute()
const router = useRouter()
const store = useContentStore()

const article = computed(() =>
  store.articles.find((a) => a.id === Number(route.params.id))
)
const cat = computed(() =>
  article.value ? store.categoryMap[article.value.category] || {} : {}
)
</script>

<template>
  <div>
    <el-page-header @back="router.push('/')" content="返回首页" style="margin-bottom: 20px" />

    <div v-if="article" class="article-wrap">
      <header class="article-header">
        <div class="article-tags">
          <el-tag type="danger" effect="light" @click="router.push({ name: 'category', params: { id: article.category } })">
            {{ cat.icon }} {{ cat.name }}
          </el-tag>
          <span class="article-date">{{ article.date }}</span>
        </div>
        <h1 class="article-title">{{ article.title }}</h1>
        <p class="article-summary">{{ article.summary }}</p>
      </header>

      <!-- Markdown 渲染正文 -->
      <article class="article-content markdown-body" v-html="article.html"></article>

      <footer class="article-footer" v-if="article.source">
        <span class="source-label">资料来源：</span>{{ article.source }}
      </footer>
    </div>

    <el-empty v-else description="文章不存在或已删除" />
  </div>
</template>

<style scoped>
.article-wrap {
  background: #fff;
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  padding: 36px 44px;
}

.article-header {
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding-bottom: 24px;
  margin-bottom: 28px;
}

.article-tags {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.article-date {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.article-title {
  font-size: 30px;
  color: var(--el-text-color-primary);
  margin: 0 0 12px;
  line-height: 1.4;
}

.article-summary {
  font-size: 15px;
  color: var(--el-text-color-secondary);
  line-height: 1.8;
  margin: 0;
}

.article-footer {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px dashed var(--el-border-color);
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.source-label {
  font-weight: 600;
}

/* Markdown 正文样式 */
.markdown-body {
  font-size: 16px;
  line-height: 1.9;
  color: #333;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
  color: var(--el-text-color-primary);
  margin: 1.6em 0 0.8em;
  line-height: 1.4;
}

.markdown-body :deep(h2) {
  font-size: 23px;
  border-left: 4px solid #a52626;
  padding-left: 12px;
}

.markdown-body :deep(h3) {
  font-size: 19px;
}

.markdown-body :deep(p) {
  margin: 0 0 1.1em;
}

.markdown-body :deep(strong) {
  color: #7a1f1f;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 1.5em;
  margin: 0 0 1.1em;
}

.markdown-body :deep(li) {
  margin: 0.35em 0;
}

.markdown-body :deep(blockquote) {
  margin: 1.2em 0;
  padding: 12px 18px;
  background: #fdf6f0;
  border-left: 4px solid #c43a2f;
  border-radius: 0 8px 8px 0;
  color: #5c4a44;
}

.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.2em 0;
  font-size: 15px;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid var(--el-border-color-light);
  padding: 10px 14px;
  text-align: left;
}

.markdown-body :deep(th) {
  background: #fdf6f0;
  font-weight: 600;
}

.markdown-body :deep(code) {
  background: #f5f2f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
}

.markdown-body :deep(pre) {
  background: #2b1a1a;
  color: #f5e6dc;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
}
</style>
