<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import MarkdownIt from 'markdown-it'
import { useAuthStore } from '../stores/auth'
import { useContentStore } from '../stores/content'

const router = useRouter()
const auth = useAuthStore()
const store = useContentStore()

const md = new MarkdownIt({ html: false, linkify: true })

// ===== 通用请求封装（自动携带登录令牌）=====
async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...auth.authHeader(),
      ...(options.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    // 登录失效：清除本地令牌
    if (res.status === 401 && path.startsWith('/api/') && !path.endsWith('/login')) {
      auth.logout()
    }
    throw new Error(data.message || '请求失败')
  }
  return data
}

// ===== 登录 =====
const loginForm = reactive({ username: '', password: '' })
const loginLoading = ref(false)
const loginError = ref('')

async function doLogin() {
  loginError.value = ''
  if (!loginForm.username || !loginForm.password) {
    loginError.value = '请输入用户名和密码'
    return
  }
  loginLoading.value = true
  try {
    await auth.login(loginForm.username, loginForm.password)
    ElMessage.success('登录成功，欢迎回来！')
    await loadAll()
  } catch (err) {
    loginError.value = err.message
  } finally {
    loginLoading.value = false
  }
}

function doLogout() {
  auth.logout()
  ElMessage.info('已退出登录')
}

// ===== 数据加载 =====
const activeTab = ref('articles')
const articles = ref([])
const categories = ref([])
const quiz = ref([])
const loading = ref(false)

async function loadAll() {
  loading.value = true
  try {
    const [a, c, q] = await Promise.all([
      api('/api/articles'),
      api('/api/categories'),
      api('/api/quiz'),
    ])
    articles.value = a
    categories.value = c
    quiz.value = q
    // 同步前台内容 store，让前台页面即时刷新
    await Promise.all([
      store.refreshArticles(),
      store.refreshCategories(),
      store.refreshQuiz(),
    ])
  } finally {
    loading.value = false
  }
}

// ===== 文章管理 =====
const articleDialog = ref(false)
const articlePreview = ref(false)
const savingArticle = ref(false)
const articleForm = ref({})
const editingArticleId = ref(null)

const today = () => new Date().toISOString().slice(0, 10)

function openCreateArticle() {
  editingArticleId.value = null
  articleForm.value = {
    title: '',
    category: categories.value[0]?.id || '',
    date: today(),
    source: '',
    summary: '',
    content: '',
  }
  articlePreview.value = false
  articleDialog.value = true
}

function openEditArticle(row) {
  editingArticleId.value = row.id
  articleForm.value = {
    title: row.title,
    category: row.category,
    date: row.date,
    source: row.source,
    summary: row.summary,
    content: row.content,
  }
  articlePreview.value = false
  articleDialog.value = true
}

async function saveArticle() {
  const f = articleForm.value
  if (!f.title || !f.content) {
    ElMessage.warning('标题和正文为必填项')
    return
  }
  savingArticle.value = true
  try {
    if (editingArticleId.value) {
      await api(`/api/articles/${editingArticleId.value}`, {
        method: 'PUT',
        body: JSON.stringify(f),
      })
      ElMessage.success('文章已更新')
    } else {
      await api('/api/articles', { method: 'POST', body: JSON.stringify(f) })
      ElMessage.success('文章已发布')
    }
    articleDialog.value = false
    await loadAll()
  } catch (err) {
    ElMessage.error(err.message)
  } finally {
    savingArticle.value = false
  }
}

async function deleteArticle(row) {
  try {
    await api(`/api/articles/${row.id}`, { method: 'DELETE' })
    ElMessage.success('文章已删除')
    await loadAll()
  } catch (err) {
    ElMessage.error(err.message)
  }
}

const articlePreviewHtml = computed(() => md.render(articleForm.value.content || ''))

// ===== 分类管理 =====
const categoryDialog = ref(false)
const savingCategory = ref(false)
const categoryForm = ref({})
const editingCategoryId = ref(null)

function openCreateCategory() {
  editingCategoryId.value = null
  categoryForm.value = { id: '', name: '', description: '', icon: '📁' }
  categoryDialog.value = true
}

function openEditCategory(row) {
  editingCategoryId.value = row.id
  categoryForm.value = { ...row }
  categoryDialog.value = true
}

async function saveCategory() {
  const f = categoryForm.value
  if (!f.name) {
    ElMessage.warning('分类名称为必填项')
    return
  }
  savingCategory.value = true
  try {
    if (editingCategoryId.value) {
      await api(`/api/categories/${editingCategoryId.value}`, {
        method: 'PUT',
        body: JSON.stringify(f),
      })
      ElMessage.success('分类已更新')
    } else {
      if (!f.id) {
        ElMessage.warning('新建分类需要填写英文 ID')
        return
      }
      await api('/api/categories', { method: 'POST', body: JSON.stringify(f) })
      ElMessage.success('分类已创建')
    }
    categoryDialog.value = false
    await loadAll()
  } catch (err) {
    ElMessage.error(err.message)
  } finally {
    savingCategory.value = false
  }
}

async function deleteCategory(row) {
  try {
    await api(`/api/categories/${row.id}`, { method: 'DELETE' })
    ElMessage.success('分类已删除')
    await loadAll()
  } catch (err) {
    ElMessage.error(err.message)
  }
}

// ===== 问答管理 =====
const quizDialog = ref(false)
const savingQuiz = ref(false)
const quizForm = ref({})
const editingQuizId = ref(null)

function openCreateQuiz() {
  editingQuizId.value = null
  quizForm.value = { question: '', options: ['', '', '', ''], answer: 0, explanation: '' }
  quizDialog.value = true
}

function openEditQuiz(row) {
  editingQuizId.value = row.id
  const options = [...row.options]
  while (options.length < 4) options.push('')
  quizForm.value = { question: row.question, options, answer: row.answer, explanation: row.explanation }
  quizDialog.value = true
}

async function saveQuiz() {
  const f = quizForm.value
  const validOptions = f.options.filter((o) => o && o.trim())
  if (!f.question || validOptions.length < 2) {
    ElMessage.warning('题目和至少两个选项为必填')
    return
  }
  savingQuiz.value = true
  try {
    const payload = {
      question: f.question,
      options: validOptions,
      answer: f.answer,
      explanation: f.explanation,
    }
    if (editingQuizId.value) {
      await api(`/api/quiz/${editingQuizId.value}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      ElMessage.success('题目已更新')
    } else {
      await api('/api/quiz', { method: 'POST', body: JSON.stringify(payload) })
      ElMessage.success('题目已创建')
    }
    quizDialog.value = false
    await loadAll()
  } catch (err) {
    ElMessage.error(err.message)
  } finally {
    savingQuiz.value = false
  }
}

async function deleteQuiz(row) {
  try {
    await api(`/api/quiz/${row.id}`, { method: 'DELETE' })
    ElMessage.success('题目已删除')
    await loadAll()
  } catch (err) {
    ElMessage.error(err.message)
  }
}

// ===== 修改密码 =====
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirm: '' })
const changingPwd = ref(false)

async function changePassword() {
  if (!pwdForm.oldPassword || !pwdForm.newPassword) {
    ElMessage.warning('请填写原密码和新密码')
    return
  }
  if (pwdForm.newPassword !== pwdForm.confirm) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }
  if (pwdForm.newPassword.length < 6) {
    ElMessage.warning('新密码至少 6 位')
    return
  }
  changingPwd.value = true
  try {
    await api('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword }),
    })
    ElMessage.success('密码已修改，请重新登录')
    pwdForm.oldPassword = ''
    pwdForm.newPassword = ''
    pwdForm.confirm = ''
    doLogout()
  } catch (err) {
    ElMessage.error(err.message)
  } finally {
    changingPwd.value = false
  }
}

// 进入页面时：已登录则加载数据
onMounted(() => {
  if (auth.isLoggedIn) {
    loadAll()
  }
})

// 回到前台
function goHome() {
  router.push('/')
}
</script>

<template>
  <div>
    <!-- ============ 未登录：登录表单 ============ -->
    <div v-if="!auth.isLoggedIn" class="login-wrap">
      <div class="login-card">
        <div class="login-title">🔐 后台管理登录</div>
        <p class="login-desc">仅限管理员访问，普通访客请返回首页浏览科普内容</p>

        <el-form label-position="top" @submit.prevent="doLogin">
          <el-form-item label="用户名">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              size="large"
              autocomplete="username"
            />
          </el-form-item>
          <el-form-item label="密码">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              show-password
              autocomplete="current-password"
              @keyup.enter="doLogin"
            />
          </el-form-item>
        </el-form>

        <el-alert
          v-if="loginError"
          :title="loginError"
          type="error"
          show-icon
          :closable="false"
          style="margin-bottom: 14px"
        />

        <el-button
          type="danger"
          size="large"
          style="width: 100%"
          :loading="loginLoading"
          @click="doLogin"
        >登 录</el-button>

        <div class="login-hint">默认账号：admin（登录后请及时修改密码）</div>

        <el-button text type="primary" @click="goHome">← 返回首页</el-button>
      </div>
    </div>

    <!-- ============ 已登录：管理界面 ============ -->
    <div v-else class="admin-wrap">
      <div class="admin-header">
        <div>
          <h1 class="admin-title">后台管理</h1>
          <p class="admin-sub">当前管理员：{{ auth.username }} · 编辑内容将真实保存到数据库</p>
        </div>
        <div class="admin-actions">
          <el-button @click="goHome">查看前台</el-button>
          <el-button type="danger" plain @click="doLogout">退出登录</el-button>
        </div>
      </div>

      <el-tabs v-model="activeTab" v-loading="loading">
        <!-- 文章管理 -->
        <el-tab-pane label="📝 文章管理" name="articles">
          <div class="toolbar">
            <el-button type="danger" @click="openCreateArticle">＋ 新增文章</el-button>
            <el-button @click="loadAll">刷新</el-button>
          </div>

          <el-table :data="articles" stripe style="width: 100%">
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="title" label="标题" min-width="240" show-overflow-tooltip />
            <el-table-column label="分类" width="130">
              <template #default="{ row }">
                <el-tag effect="light">{{ row.categoryIcon }} {{ row.categoryName }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="openEditArticle(row)">编辑</el-button>
                <el-popconfirm
                  title="确定删除这篇文章吗？"
                  confirm-button-text="删除"
                  cancel-button-text="取消"
                  @confirm="deleteArticle(row)"
                >
                  <template #reference>
                    <el-button size="small" type="danger" plain>删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 分类管理 -->
        <el-tab-pane label="🗂️ 分类管理" name="categories">
          <div class="toolbar">
            <el-button type="danger" @click="openCreateCategory">＋ 新增分类</el-button>
            <el-button @click="loadAll">刷新</el-button>
          </div>

          <el-table :data="categories" stripe style="width: 100%">
            <el-table-column prop="id" label="ID" width="110" />
            <el-table-column prop="icon" label="图标" width="70" />
            <el-table-column prop="name" label="名称" width="140" />
            <el-table-column prop="description" label="简介" min-width="260" show-overflow-tooltip />
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="openEditCategory(row)">编辑</el-button>
                <el-popconfirm
                  title="确定删除该分类吗？（分类下有文章时无法删除）"
                  confirm-button-text="删除"
                  cancel-button-text="取消"
                  @confirm="deleteCategory(row)"
                >
                  <template #reference>
                    <el-button size="small" type="danger" plain>删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 问答管理 -->
        <el-tab-pane label="❓ 问答管理" name="quiz">
          <div class="toolbar">
            <el-button type="danger" @click="openCreateQuiz">＋ 新增题目</el-button>
            <el-button @click="loadAll">刷新</el-button>
          </div>

          <el-table :data="quiz" stripe style="width: 100%">
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="question" label="题目" min-width="280" show-overflow-tooltip />
            <el-table-column label="正确答案" width="220">
              <template #default="{ row }">
                <el-tag type="success" effect="light">{{ row.options[row.answer] }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="openEditQuiz(row)">编辑</el-button>
                <el-popconfirm
                  title="确定删除这道题吗？"
                  confirm-button-text="删除"
                  cancel-button-text="取消"
                  @confirm="deleteQuiz(row)"
                >
                  <template #reference>
                    <el-button size="small" type="danger" plain>删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 修改密码 -->
        <el-tab-pane label="🔑 修改密码" name="password">
          <div class="pwd-wrap">
            <el-form label-position="top" style="max-width: 420px">
              <el-form-item label="原密码">
                <el-input v-model="pwdForm.oldPassword" type="password" show-password />
              </el-form-item>
              <el-form-item label="新密码">
                <el-input v-model="pwdForm.newPassword" type="password" show-password />
              </el-form-item>
              <el-form-item label="确认新密码">
                <el-input v-model="pwdForm.confirm" type="password" show-password @keyup.enter="changePassword" />
              </el-form-item>
              <el-button type="danger" :loading="changingPwd" @click="changePassword">
                确认修改密码
              </el-button>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- ============ 文章编辑弹窗 ============ -->
    <el-dialog
      v-model="articleDialog"
      :title="editingArticleId ? '编辑文章' : '新增文章'"
      width="720px"
      top="4vh"
    >
      <el-form label-position="top">
        <el-row :gutter="16">
          <el-col :span="14">
            <el-form-item label="标题" required>
              <el-input v-model="articleForm.title" placeholder="请输入文章标题" />
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="分类" required>
              <el-select v-model="articleForm.category" style="width: 100%">
                <el-option
                  v-for="c in categories"
                  :key="c.id"
                  :label="`${c.icon} ${c.name}`"
                  :value="c.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="日期">
              <el-date-picker
                v-model="articleForm.date"
                type="date"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="来源（可选）">
          <el-input v-model="articleForm.source" placeholder="如：泸州老窖官网 / 人民日报 / 百度百科…" />
        </el-form-item>

        <el-form-item label="摘要（列表页展示的一句话简介）">
          <el-input v-model="articleForm.summary" :rows="2" type="textarea" placeholder="用一句话概括本文内容" />
        </el-form-item>

        <el-form-item label="正文（Markdown 格式）">
          <div class="editor-switch">
            <el-radio-group v-model="articlePreview" size="small">
              <el-radio-button :value="false">编辑</el-radio-button>
              <el-radio-button :value="true">预览</el-radio-button>
            </el-radio-group>
          </div>
          <el-input
            v-if="!articlePreview"
            v-model="articleForm.content"
            type="textarea"
            :rows="14"
            class="md-editor"
            placeholder="支持 Markdown 语法：标题、列表、表格、引用等"
          />
          <div v-else class="markdown-preview" v-html="articlePreviewHtml"></div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="articleDialog = false">取消</el-button>
        <el-button type="danger" :loading="savingArticle" @click="saveArticle">保存</el-button>
      </template>
    </el-dialog>

    <!-- ============ 分类编辑弹窗 ============ -->
    <el-dialog
      v-model="categoryDialog"
      :title="editingCategoryId ? '编辑分类' : '新增分类'"
      width="480px"
    >
      <el-form label-position="top">
        <el-form-item label="分类 ID（英文，唯一标识）">
          <el-input v-model="categoryForm.id" placeholder="如：history" :disabled="!!editingCategoryId" />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="categoryForm.name" placeholder="如：历史沿革" />
        </el-form-item>
        <el-form-item label="图标（emoji）">
          <el-input v-model="categoryForm.icon" placeholder="如：🏺" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="categoryForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialog = false">取消</el-button>
        <el-button type="danger" :loading="savingCategory" @click="saveCategory">保存</el-button>
      </template>
    </el-dialog>

    <!-- ============ 问答编辑弹窗 ============ -->
    <el-dialog
      v-model="quizDialog"
      :title="editingQuizId ? '编辑题目' : '新增题目'"
      width="600px"
    >
      <el-form label-position="top">
        <el-form-item label="题目" required>
          <el-input v-model="quizForm.question" :rows="2" type="textarea" />
        </el-form-item>

        <el-form-item label="选项（至少 2 个，最多 4 个）" required>
          <div class="option-list">
            <div v-for="(opt, i) in quizForm.options" :key="i" class="option-row">
              <span class="option-idx">{{ 'ABCD'[i] }}</span>
              <el-input v-model="quizForm.options[i]" :placeholder="`选项 ${'ABCD'[i]}`" />
            </div>
          </div>
        </el-form-item>

        <el-form-item label="正确答案">
          <el-select v-model="quizForm.answer" style="width: 100%">
            <el-option
              v-for="(opt, i) in quizForm.options"
              :key="i"
              :label="`${'ABCD'[i]}：${opt || '（空）'}`"
              :value="i"
              :disabled="!opt"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="答案解析">
          <el-input v-model="quizForm.explanation" :rows="3" type="textarea" placeholder="答题后展示给用户的知识点解释" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="quizDialog = false">取消</el-button>
        <el-button type="danger" :loading="savingQuiz" @click="saveQuiz">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/* 登录 */
.login-wrap {
  display: flex;
  justify-content: center;
  padding: 40px 0 60px;
}

.login-card {
  background: #fff;
  border: 1px solid var(--el-border-color-light);
  border-radius: 16px;
  padding: 36px 40px;
  width: 380px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.06);
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin-bottom: 6px;
}

.login-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 0 0 20px;
}

.login-hint {
  margin: 14px 0 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.login-card :deep(.el-form-item) {
  margin-bottom: 18px;
}

/* 管理界面 */
.admin-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.admin-title {
  font-size: 26px;
  margin: 0 0 4px;
}

.admin-sub {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 0;
}

.toolbar {
  margin-bottom: 16px;
  display: flex;
  gap: 10px;
}

.pwd-wrap {
  padding: 10px 0;
}

/* 文章编辑 */
.editor-switch {
  margin-bottom: 10px;
}

.md-editor :deep(textarea) {
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.7;
}

.markdown-preview {
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  padding: 16px 20px;
  max-height: 380px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.8;
  background: #fff;
}

.markdown-preview :deep(h2) {
  border-left: 4px solid #a52626;
  padding-left: 10px;
  font-size: 20px;
}

.markdown-preview :deep(blockquote) {
  background: #fdf6f0;
  border-left: 4px solid #c43a2f;
  padding: 10px 14px;
  margin: 12px 0;
}

.markdown-preview :deep(table) {
  border-collapse: collapse;
  width: 100%;
}

.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  border: 1px solid var(--el-border-color-light);
  padding: 6px 10px;
}

/* 选项列表 */
.option-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.option-idx {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}
</style>
