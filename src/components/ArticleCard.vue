<script setup>
import { useRouter } from 'vue-router'
import { useContentStore } from '../stores/content'

const props = defineProps({
  article: { type: Object, required: true },
})

const router = useRouter()
const store = useContentStore()
const cat = store.categoryMap[props.article.category] || {}
</script>

<template>
  <el-card
    class="article-card"
    shadow="hover"
    :body-style="{ padding: '18px' }"
    @click="router.push({ name: 'article', params: { id: article.id } })"
  >
    <div class="card-category">
      <span class="cat-icon">{{ cat.icon }}</span>
      <el-tag size="small" type="danger" effect="light">{{ cat.name }}</el-tag>
    </div>
    <h3 class="card-title">{{ article.title }}</h3>
    <p class="card-summary">{{ article.summary }}</p>
    <div class="card-meta">
      <span>{{ article.date }}</span>
      <span class="read-more">阅读全文 →</span>
    </div>
  </el-card>
</template>

<style scoped>
.article-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.article-card:hover {
  transform: translateY(-3px);
}

.card-category {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.cat-icon {
  font-size: 18px;
}

.card-title {
  font-size: 17px;
  color: var(--el-text-color-primary);
  margin: 0 0 8px;
  line-height: 1.4;
}

.card-summary {
  font-size: 13.5px;
  color: var(--el-text-color-regular);
  margin: 0 0 14px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}

.read-more {
  color: #a52626;
  font-weight: 500;
}
</style>
