<script setup>
import { ref, computed } from 'vue'
import { useContentStore } from '../stores/content'

const store = useContentStore()

const QUIZ_SIZE = 15 // 每次随机抽取的题数

// 本轮要做的题（从题库随机抽取，未开始前为空数组）
const round = ref([])
const started = ref(false) // 是否已点击开始
const current = ref(0) // 当前题号
const answers = ref([]) // 已选答案
const finished = ref(false) // 是否交卷

const poolSize = computed(() => store.quizQuestions.length)
const total = computed(() => round.value.length)
const currentQuestion = computed(() => round.value[current.value])

const score = computed(() => {
  let s = 0
  round.value.forEach((q, i) => {
    if (answers.value[i] === q.answer) s++
  })
  return s
})

// Fisher–Yates 洗牌
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 开始测验：从题库随机抽 15 道作为本轮题目
function start() {
  round.value = shuffle(store.quizQuestions).slice(0, QUIZ_SIZE)
  current.value = 0
  answers.value = []
  finished.value = false
  started.value = true
}

function select(index) {
  answers.value[current.value] = index
  // 选择后自动进入下一题
  setTimeout(() => {
    if (current.value < total.value - 1) {
      current.value++
    } else {
      finished.value = true
    }
  }, 300)
}

// 再测一次：重新洗牌抽题
function restart() {
  start()
}

function goPrev() {
  if (current.value > 0) current.value--
}

const verdict = computed(() => {
  const ratio = total.value ? score.value / total.value : 0
  if (ratio >= 0.9) return { text: '🏆 白酒达人！你对泸州老窖如数家珍', level: 'success' }
  if (ratio >= 0.7) return { text: '👍 很不错的成绩，已是半只脚入门', level: 'success' }
  if (ratio >= 0.5) return { text: '🙂 及格啦，再多读几篇科普文章吧', level: 'warning' }
  return { text: '📖 还需要多多了解，先从首页文章看起吧', level: 'info' }
})
</script>

<template>
  <div>
    <h1 class="page-title">🍶 知识问答</h1>
    <p class="page-desc">
      题库共 {{ poolSize }} 道，每次随机抽 {{ QUIZ_SIZE }} 道，每题 1 分。
    </p>

    <!-- 开始页：随机抽题说明 -->
    <div v-if="!started && poolSize" class="start-card">
      <div class="start-icon">🍶</div>
      <h2 class="start-title">准备好了吗？</h2>
      <p class="start-desc">
        本测验会从题库（共 {{ poolSize }} 道）中<b>随机抽取 {{ QUIZ_SIZE }} 道</b>，每次题目都不同。<br>
        <b>每题 1 分</b>，交卷后立即显示得分与逐题解析。
      </p>
      <el-button type="danger" size="large" round @click="start">开始测验</el-button>
    </div>

    <!-- 答题中 -->
    <div v-else-if="started && !finished && currentQuestion" class="quiz-card">
      <div class="quiz-progress">
        <el-progress
          :percentage="Math.round((current / total) * 100)"
          :stroke-width="8"
          color="#a52626"
        />
        <span class="quiz-count">第 {{ current + 1 }} / {{ total }} 题</span>
      </div>

      <h2 class="quiz-question">{{ currentQuestion.question }}</h2>

      <div class="quiz-options">
        <div
          v-for="(opt, i) in currentQuestion.options"
          :key="i"
          class="quiz-option"
          :class="{
            selected: answers[current] === i,
            correct: answers[current] === i && i === currentQuestion.answer,
            wrong: answers[current] === i && i !== currentQuestion.answer,
            show: answers[current] !== undefined
          }"
          @click="select(i)"
        >
          <span class="option-letter">{{ 'ABCD'[i] }}</span>
          <span class="option-text">{{ opt }}</span>
          <span class="option-mark" v-if="answers[current] !== undefined">
            {{ i === currentQuestion.answer ? '✅' : (answers[current] === i ? '❌' : '') }}
          </span>
        </div>
      </div>

      <!-- 答案解析 -->
      <div class="quiz-explanation" v-if="answers[current] !== undefined">
        <strong>解析：</strong>{{ currentQuestion.explanation }}
      </div>

      <div class="quiz-nav">
        <el-button :disabled="current === 0" @click="goPrev">上一题</el-button>
        <el-button
          v-if="current === total - 1"
          type="danger"
          :disabled="answers[current] === undefined"
          @click="finished = true"
        >交卷</el-button>
      </div>
    </div>

    <!-- 成绩单 -->
    <div v-else-if="started && finished" class="result-card">
      <div class="result-score">
        <div class="score-number">{{ score }} / {{ total }} 分</div>
        <el-tag :type="verdict.level" size="large" effect="light">{{ verdict.text }}</el-tag>
      </div>

      <div class="result-detail">
        <div
          v-for="(q, i) in round"
          :key="i"
          class="result-item"
          :class="{ 'item-wrong': answers[i] !== q.answer }"
        >
          <div class="result-q">
            <span class="result-mark">{{ answers[i] === q.answer ? '✅' : '❌' }}</span>
            <span class="result-title">{{ i + 1 }}. {{ q.question }}</span>
          </div>
          <div class="result-answer" v-if="answers[i] !== q.answer">
            正确答案：<strong>{{ q.options[q.answer] }}</strong>
          </div>
          <div class="result-explain">📖 {{ q.explanation }}</div>
        </div>
      </div>

      <div class="result-actions">
        <el-button type="danger" size="large" round @click="restart">再测一次</el-button>
      </div>
    </div>

    <el-empty v-else description="题库加载中…" />
  </div>
</template>

<style scoped>
.page-title {
  font-size: 26px;
  margin: 0 0 8px;
}

.page-desc {
  color: var(--el-text-color-secondary);
  margin: 0 0 24px;
}

/* 开始页 */
.start-card {
  background: #fff;
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  padding: 44px 32px;
  max-width: 720px;
  text-align: center;
}

.start-icon {
  font-size: 54px;
  margin-bottom: 14px;
}

.start-title {
  font-size: 24px;
  margin: 0 0 12px;
}

.start-desc {
  color: var(--el-text-color-secondary);
  font-size: 15px;
  line-height: 2;
  margin: 0 0 26px;
}

.start-desc b {
  color: #a52626;
}

.quiz-card {
  background: #fff;
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  padding: 28px 32px;
  max-width: 720px;
}

.quiz-progress {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 22px;
}

.quiz-progress .el-progress {
  flex: 1;
}

.quiz-count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.quiz-question {
  font-size: 21px;
  color: var(--el-text-color-primary);
  margin: 0 0 20px;
  line-height: 1.5;
}

.quiz-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.quiz-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 16px;
  border: 1.5px solid var(--el-border-color);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
}

.quiz-option:hover {
  border-color: #c43a2f;
  background: #fdf6f0;
}

.option-letter {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #eee;
  color: #555;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.quiz-option.selected {
  border-color: #c43a2f;
  background: #fdf6f0;
}

.quiz-option.correct {
  border-color: #67c23a;
  background: #f0f9eb;
}

.quiz-option.wrong {
  border-color: #f56c6c;
  background: #fef0f0;
}

.quiz-option.correct .option-letter {
  background: #67c23a;
  color: #fff;
}

.quiz-option.wrong .option-letter {
  background: #f56c6c;
  color: #fff;
}

.option-mark {
  margin-left: auto;
  font-size: 18px;
}

.quiz-explanation {
  background: #fdf6f0;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.7;
  margin-bottom: 18px;
}

.quiz-nav {
  display: flex;
  justify-content: space-between;
}

/* 成绩单 */
.result-card {
  background: #fff;
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  padding: 28px 32px;
}

.result-score {
  text-align: center;
  padding: 20px 0 26px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 22px;
}

.score-number {
  font-size: 44px;
  font-weight: 800;
  color: #a52626;
  margin-bottom: 10px;
}

.result-detail {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.result-item {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  padding: 14px 18px;
}

.result-item.item-wrong {
  border-color: #f3caca;
  background: #fffbfb;
}

.result-q {
  display: flex;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
}

.result-mark {
  flex-shrink: 0;
}

.result-answer {
  margin-top: 8px;
  font-size: 14px;
  color: #7a1f1f;
}

.result-explain {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.7;
}

.result-actions {
  text-align: center;
  margin-top: 26px;
}
</style>
