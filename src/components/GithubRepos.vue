<template>
  <section id="portfolio" class="section-shell work-section repo-section">
    <div class="section-heading">
      <div>
        <span class="section-index">GITHUB / 03</span>
        <h2>My <em>Repos</em></h2>
        <p>
          Live snapshot of public repositories from
          <strong>@{{ username }}</strong> on GitHub, pulled straight from the
          REST API.
        </p>
      </div>

      <div class="repo-summary" v-if="!loading && !error">
        <div class="repo-summary__item">
          <strong>{{ repos.length }}</strong>
          <span>Repos</span>
        </div>
        <div class="repo-summary__item">
          <strong>{{ formatNumber(totalStars) }}</strong>
          <span>Stars</span>
        </div>
        <div class="repo-summary__item">
          <strong>{{ formatNumber(totalForks) }}</strong>
          <span>Forks</span>
        </div>
      </div>
    </div>

    <!-- Language filter pills -->
    <div class="project-filter" v-if="!loading && !error && languages.length > 1">
      <button
        v-for="lang in languages"
        :key="lang"
        class="project-filter__button"
        :class="{ 'is-active': activeLanguage === lang }"
        type="button"
        @click="setLanguage(lang)"
      >
        {{ lang }}
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="repo-grid">
      <div v-for="n in 6" :key="n" class="repo-card repo-card--skeleton" aria-hidden="true">
        <div class="skeleton-line skeleton-line--short"></div>
        <div class="skeleton-line skeleton-line--title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line skeleton-line--short"></div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="repo-error">
      <p>{{ error }}</p>
      <button class="repo-error__retry" type="button" @click="fetchRepos">
        Try again
      </button>
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredRepos.length === 0" class="repo-error">
      <p>No repositories match this filter.</p>
    </div>

    <!-- Repo grid -->
    <template v-else>
      <div class="repo-grid">
        <a
          v-for="(repo, i) in pagedRepos"
          :key="repo.id"
          class="repo-card"
          :style="{ '--accent': i % 2 === 0 ? 'var(--orange)' : 'var(--blue)' }"
          :href="repo.html_url"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="repo-card__top">
            <span class="repo-card__type">{{ repo.fork ? 'Fork' : 'Repo' }}</span>
            <span class="repo-card__updated">Updated {{ formatDate(repo.pushed_at) }}</span>
          </div>

          <h3 class="repo-card__name">{{ repo.name }}</h3>
          <p class="repo-card__desc">
            {{ repo.description || 'No description provided.' }}
          </p>

          <ul v-if="repo.topics && repo.topics.length" class="repo-card__topics">
            <li v-for="topic in repo.topics.slice(0, 4)" :key="topic">{{ topic }}</li>
          </ul>

          <div class="repo-card__stats">
            <span v-if="repo.language" class="repo-card__lang">
              <i :style="{ background: languageColor(repo.language) }"></i>
              {{ repo.language }}
            </span>
            <span class="repo-card__stat">★ {{ formatNumber(repo.stargazers_count) }}</span>
            <span class="repo-card__stat">⑂ {{ formatNumber(repo.forks_count) }}</span>
          </div>
        </a>
      </div>

      <div class="pagination" v-if="totalPages > 1">
        <button type="button" :disabled="page === 1" @click="page -= 1">Prev</button>
        <span>{{ page }} / {{ totalPages }}</span>
        <button type="button" :disabled="page === totalPages" @click="page += 1">Next</button>
      </div>

      <a
        class="repo-viewall"
        :href="`https://github.com/${username}`"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View full profile on GitHub"
        title="View full profile on GitHub"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M12 2C6.477 2 2 6.58 2 12.217c0 4.51 2.865 8.33 6.839 9.684.5.093.682-.217.682-.482 0-.237-.009-.865-.014-1.697-2.782.606-3.369-1.342-3.369-1.342-.455-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.004.071 1.532 1.032 1.532 1.032.892 1.528 2.34 1.087 2.91.831.091-.646.349-1.086.634-1.336-2.22-.253-4.555-1.112-4.555-4.946 0-1.092.39-1.986 1.029-2.684-.103-.253-.446-1.273.098-2.65 0 0 .84-.27 2.75 1.026A9.55 9.55 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.91-1.296 2.748-1.026 2.748-1.026.546 1.377.203 2.397.1 2.65.641.698 1.027 1.592 1.027 2.684 0 3.842-2.337 4.69-4.566 4.939.359.31.679.921.679 1.855 0 1.338-.012 2.418-.012 2.748 0 .268.18.58.688.482A10.012 10.012 0 0 0 22 12.217C22 6.58 17.523 2 12 2Z"
          />
        </svg>
      </a>
    </template>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  username: { type: String, default: 'YYT-0901' },
  perPage: { type: Number, default: 100 },
  pageSize: { type: Number, default: 6 },
})

const repos = ref([])
const loading = ref(true)
const error = ref('')
const activeLanguage = ref('All')
const page = ref(1)

const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Vue: '#41b883',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Go: '#00ADD8',
  Rust: '#dea584',
  Shell: '#89e051',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
}

const languageColor = (lang) => LANGUAGE_COLORS[lang] || '#8b8f98'

const formatNumber = (n) => {
  if (n == null) return '0'
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return String(n)
}

const formatDate = (iso) => {
  if (!iso) return '—'
  const date = new Date(iso)
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const fetchRepos = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(props.username)}/repos?per_page=${props.perPage}&sort=updated`,
      { headers: { Accept: 'application/vnd.github+json' } },
    )

    if (res.status === 404) {
      throw new Error(`GitHub user "${props.username}" was not found.`)
    }
    if (res.status === 403) {
      throw new Error('GitHub API rate limit reached. Please try again in a bit.')
    }
    if (!res.ok) {
      throw new Error(`GitHub API request failed (${res.status}).`)
    }

    const data = await res.json()
    repos.value = data
      .filter((repo) => !repo.private)
      .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load GitHub repositories.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchRepos)
watch(() => props.username, fetchRepos)

const languages = computed(() => {
  const set = new Set(repos.value.map((r) => r.language).filter(Boolean))
  return ['All', ...Array.from(set).sort()]
})

const setLanguage = (lang) => {
  activeLanguage.value = lang
  page.value = 1
}

const filteredRepos = computed(() => {
  if (activeLanguage.value === 'All') return repos.value
  return repos.value.filter((r) => r.language === activeLanguage.value)
})

const totalStars = computed(() => repos.value.reduce((sum, r) => sum + (r.stargazers_count || 0), 0))
const totalForks = computed(() => repos.value.reduce((sum, r) => sum + (r.forks_count || 0), 0))

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRepos.value.length / props.pageSize)))

const pagedRepos = computed(() => {
  const start = (page.value - 1) * props.pageSize
  return filteredRepos.value.slice(start, start + props.pageSize)
})

watch(totalPages, (tp) => {
  if (page.value > tp) page.value = tp
})
</script>

<style scoped>
/*
  This component relies on the design tokens already defined in the
  reference stylesheet's :root (--blue, --blue-dark, --cream, --ink,
  --orange, --on-dark) and reuses its .section-shell / .section-heading /
  .section-index / .project-filter* / .pagination classes. Make sure that
  global stylesheet is loaded in your app (e.g. imported once in main.js).
*/

.repo-section {
  padding-top: 50px;
}

.repo-summary {
  display: flex;
  gap: clamp(20px, 3vw, 40px);
  margin-bottom: 12px;
}

.repo-summary__item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.repo-summary__item strong {
  font: 700 clamp(1.8rem, 2.6vw, 2.6rem) / 1 'Bebas Neue', sans-serif;
  color: var(--ink);
}

.repo-summary__item span {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.repo-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(20px, 3vw, 32px);
  margin-top: 24px;
}

.repo-card {
  --accent: var(--orange);

  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  border: 2px solid var(--ink);
  border-radius: 14px;
  background: var(--surface, #f4eadb);
  color: inherit;
  box-shadow: 8px 10px 0 var(--accent);
  transition: transform 220ms ease, box-shadow 220ms ease;
}

.repo-card:hover,
.repo-card:focus-visible {
  transform: translate(-3px, -4px) rotate(-0.4deg);
  box-shadow: 14px 18px 0 var(--accent);
}

.repo-card__top {
  display: flex;
  justify-content: space-between;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgb(16 36 67 / 60%);
}

.repo-card__name {
  margin: 0;
  font: 700 1.5rem/1.1 'Bebas Neue', sans-serif;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  word-break: break-word;
  color: black;
}

.repo-card__desc {
  flex: 1;
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.55;
  color: rgb(16 36 67 / 78%);

  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.repo-card__topics {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.repo-card__topics li {
  padding: 4px 9px;
  border: 1px solid var(--ink);
  border-radius: 999px;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink);
}

.repo-card__stats {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-top: 10px;
  border-top: 1px solid rgb(16 36 67 / 20%);
  font-size: 0.72rem;
  font-weight: 700;
  color: rgb(16 36 67 / 78%);
}

.repo-card__lang {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.repo-card__lang i {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

/* Skeleton loading state */
.repo-card--skeleton {
  gap: 12px;
  box-shadow: none;
  pointer-events: none;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, rgb(16 36 67 / 10%) 25%, rgb(16 36 67 / 18%) 37%, rgb(16 36 67 / 10%) 63%);
  background-size: 400% 100%;
  animation: skeleton-shimmer 1.4s ease infinite;
}

.skeleton-line--title {
  width: 60%;
  height: 22px;
}

.skeleton-line--short {
  width: 40%;
}

@keyframes skeleton-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

.repo-error {
  padding: 40px 24px;
  border: 2px dashed var(--ink);
  border-radius: 14px;
  text-align: center;
  color: rgb(16 36 67 / 78%);
}

.repo-error__retry {
  margin-top: 14px;
  padding: 10px 18px;
  border: 1px solid var(--ink);
  border-radius: 999px;
  background: var(--ink);
  color: var(--cream);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
}

.repo-section {
  position: relative;
}

.repo-viewall {
  position: absolute;
  top: 18px;
  right: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  color: black;
  box-shadow: 4px 6px 0 rgba(16, 36, 67, 0.15);
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.repo-viewall:hover,
.repo-viewall:focus-visible {
  transform: translate(-2px, -2px);
  box-shadow: 8px 10px 0 rgba(16, 36, 67, 0.15);
}

.repo-viewall svg {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

@media (max-width: 900px) {
  .repo-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 600px) {
  .repo-grid { grid-template-columns: 1fr; }
  .repo-summary { gap: 20px; }
}
</style>
