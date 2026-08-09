<script setup>
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
import { useContentStore } from './stores/content'

const store = useContentStore()
// 应用启动时加载全部科普内容
store.load()
</script>

<template>
  <div class="app-shell">
    <NavBar />
    <main class="app-main">
      <RouterView />
    </main>
    <footer class="app-footer">
      <p>泸州老窖科普知识平台 · 仅供学习科普之用 · 内容整理自公开资料</p>
    </footer>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.app-footer {
  border-top: 1px solid var(--el-border-color-light);
  padding: 20px 16px;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
