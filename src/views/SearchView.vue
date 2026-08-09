<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { useContentStore } from '../stores/content'
import ArticleCard from '../components/ArticleCard.vue'

const router = useRouter()
const route = useRoute()
const store = useContentStore()

// 从 URL 查询参数 ?q= 读取初始关键词
const keyword = ref(route.query.q || '')
const results = computed(() => store.search(keyword.value.trim()))

function clear() {
  keyword.value = ''
}
</script>

<template>
  <div>
    <h1 class="page-title">🔍 搜索科普文章</h1>

    <div class="search-bar">
      <el-input
        v-model="keyword"
        size="large"
        placeholder="输入关键词，如：国窖1573、非遗、灯塔工厂…"
        :prefix-icon="Search"
        clearable
        @clear="clear"
      />
    </div>

    <div class="result-tip" v-if="keyword.trim()">
      找到 <strong>{{ results.length }}</strong> 篇相关文章
    </div>

    <div class="article-grid" v-if="results.length">
      <ArticleCard v-for="a in results" :key="a.id" :article="a" />
    </div>

    <el-empty
      v-else-if="keyword.trim()"
      description="没有找到相关文章，换个关键词试试"
    />

    <div v-else class="placeholder-tip">
      <p>💡 试试搜索这些热门词：</p>
      <div class="hot-words">
        <el-tag
          v-for="w in ['国窖1573', '非遗', '浓香鼻祖', '1573', '灯塔工厂', '分红', '五码']"
          :key="w"
          size="large"
          effect="plain"
          class="hot-word"
          @click="keyword = w"
        >{{ w }}</el-tag>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-title {
  font-size: 26px;
  margin: 0 0 20px;
}

.search-bar {
  margin-bottom: 18px;
}

.result-tip {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 16px;
}

.article-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.placeholder-tip p {
  font-size: 15px;
  color: var(--el-text-color-regular);
}

.hot-words {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hot-word {
  cursor: pointer;
}
</style>
