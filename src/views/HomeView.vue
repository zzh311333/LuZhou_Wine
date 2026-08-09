<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useContentStore } from '../stores/content'
import ArticleCard from '../components/ArticleCard.vue'

const router = useRouter()
const store = useContentStore()
const { categories, articles } = storeToRefs(store)

// 数据异步加载，latest 需用 computed 保持响应式
const latest = computed(() => store.latestArticles(6))
</script>

<template>
  <div>
    <!-- 顶部大横幅 -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">一杯酒里，藏着700年的中国</h1>
        <p class="hero-sub">
          这里是「泸州老窖科普馆」——带你走进一座450年不曾停工的活窖池、
          一门700年口传心授的古老技艺，以及一家正在用数字重新定义白酒的企业。
        </p>
        <div class="hero-actions">
          <el-button type="danger" size="large" round @click="router.push('/quiz')">
            测一测你的白酒知识
          </el-button>
          <el-button size="large" round plain @click="router.push('/search')">
            搜索科普文章
          </el-button>
        </div>
      </div>
    </section>

    <!-- 分类入口 -->
    <section class="section">
      <h2 class="section-title">📂 内容分类</h2>
      <div class="category-grid">
        <el-card
          v-for="c in categories"
          :key="c.id"
          class="category-card"
          shadow="hover"
          @click="router.push({ name: 'category', params: { id: c.id } })"
        >
          <div class="category-icon">{{ c.icon }}</div>
          <h3 class="category-name">{{ c.name }}</h3>
          <p class="category-desc">{{ c.description }}</p>
          <div class="category-count">
            {{ store.articlesByCategory(c.id).length }} 篇文章
          </div>
        </el-card>
      </div>
    </section>

    <!-- 最新文章 -->
    <section class="section" v-if="articles.length">
      <h2 class="section-title">📰 科普文章</h2>
      <div class="article-grid">
        <ArticleCard v-for="a in latest" :key="a.id" :article="a" />
      </div>
    </section>

    <!-- 加载中 -->
    <div v-else class="loading-tip">
      <el-skeleton :rows="6" animated />
    </div>
  </div>
</template>

<style scoped>
.hero {
  background: linear-gradient(160deg, #5c1616 0%, #8c2020 55%, #b03a2c 100%);
  color: #fff;
  border-radius: 16px;
  padding: 56px 40px;
  margin-bottom: 40px;
  position: relative;
  overflow: hidden;
}

.hero::after {
  content: '🍶';
  position: absolute;
  right: 30px;
  bottom: -20px;
  font-size: 140px;
  opacity: 0.12;
  transform: rotate(-12deg);
}

.hero-title {
  font-size: 34px;
  font-weight: 800;
  margin: 0 0 16px;
  letter-spacing: 2px;
}

.hero-sub {
  font-size: 16px;
  line-height: 1.9;
  opacity: 0.92;
  max-width: 640px;
  margin: 0 0 28px;
}

.hero-actions {
  display: flex;
  gap: 12px;
}

.section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 22px;
  margin: 0 0 18px;
  color: var(--el-text-color-primary);
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.category-card {
  cursor: pointer;
  text-align: center;
  transition: transform 0.2s;
}

.category-card:hover {
  transform: translateY(-4px);
}

.category-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.category-name {
  font-size: 17px;
  margin: 0 0 8px;
}

.category-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
  margin: 0 0 10px;
}

.category-count {
  font-size: 12.5px;
  color: #a52626;
  font-weight: 600;
}

.article-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.loading-tip {
  padding: 20px 0;
}
</style>
