<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContentStore } from '../stores/content'
import ArticleCard from '../components/ArticleCard.vue'

const route = useRoute()
const router = useRouter()
const store = useContentStore()

const catId = computed(() => route.params.id)
const cat = computed(() => store.categoryMap[catId.value] || {})
const articles = computed(() => store.articlesByCategory(catId.value))
</script>

<template>
  <div>
    <el-page-header @back="router.push('/')" content="文章分类" style="margin-bottom: 20px" />

    <div class="category-header">
      <span class="header-icon">{{ cat.icon }}</span>
      <div>
        <h1 class="header-title">{{ cat.name }}</h1>
        <p class="header-desc">{{ cat.description }}</p>
      </div>
    </div>

    <div class="count-tip" v-if="articles.length">
      共 {{ articles.length }} 篇科普文章
    </div>

    <div class="article-grid">
      <ArticleCard v-for="a in articles" :key="a.id" :article="a" />
    </div>

    <el-empty
      v-if="!articles.length"
      description="该分类暂时没有文章"
    />
  </div>
</template>

<style scoped>
.category-header {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fdf6f0;
  border: 1px solid #f3ddd0;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 16px;
}

.header-icon {
  font-size: 42px;
}

.header-title {
  font-size: 24px;
  margin: 0 0 6px;
  color: var(--el-text-color-primary);
}

.header-desc {
  font-size: 14px;
  color: var(--el-text-color-regular);
  margin: 0;
  line-height: 1.6;
}

.count-tip {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 16px;
}

.article-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}
</style>
