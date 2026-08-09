<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'

const router = useRouter()
const keyword = ref('')

function goSearch() {
  router.push({ name: 'search', query: { q: keyword.value } })
}
</script>

<template>
  <header class="nav-bar">
    <div class="nav-inner">
      <div class="nav-brand" @click="router.push('/')">
        <span class="brand-logo">🍶</span>
        <span class="brand-name">泸州老窖<span class="brand-sub">科普馆</span></span>
      </div>

      <nav class="nav-links">
        <router-link to="/" class="nav-link">首页</router-link>
        <router-link to="/quiz" class="nav-link">知识问答</router-link>
        <router-link to="/about" class="nav-link">关于</router-link>
      </nav>

      <div class="nav-search">
        <el-input
          v-model="keyword"
          placeholder="搜索科普文章…"
          :prefix-icon="Search"
          clearable
          @keyup.enter="goSearch"
        />
      </div>
    </div>
  </header>
</template>

<style scoped>
.nav-bar {
  background: linear-gradient(135deg, #7a1f1f 0%, #a52626 60%, #c43a2f 100%);
  color: #fff;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.nav-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 16px;
  height: 60px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  white-space: nowrap;
}

.brand-logo {
  font-size: 24px;
}

.brand-name {
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 1px;
}

.brand-sub {
  font-size: 12px;
  font-weight: 400;
  opacity: 0.85;
  margin-left: 2px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.nav-link {
  color: rgba(255, 255, 255, 0.92);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 15px;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s;
}

.nav-link:hover,
.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.16);
}

.nav-search {
  width: 220px;
}

.nav-search :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.16);
  box-shadow: none;
}

.nav-search :deep(.el-input__inner) {
  color: #fff;
}

.nav-search :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.7);
}

@media (max-width: 900px) {
  .nav-search {
    display: none;
  }
}
</style>
