<template>
  <section id="blog" class="section-shell work-section blog-section">
    <div class="section-heading">
      <div>
        <span class="section-index">BLOG / 04</span>
        <h2>My <em>Posts</em></h2>
        <p>
          Latest articles from
          <strong>@{{ username }}</strong> on DEV Community, pulled live from
          the official public API.
        </p>
      </div>

      <div class="blog-summary" v-if="!loading && !error">
        <div class="blog-summary__item">
          <strong>{{ posts.length }}{{ hasMore ? '+' : '' }}</strong>
          <span>Posts loaded</span>
        </div>
        <div class="blog-summary__item">
          <strong>{{ formatNumber(totalReactions) }}</strong>
          <span>Reactions</span>
        </div>
      </div>
    </div>

    <div class="blog-controls" v-if="!loading && !error && posts.length">
      <div class="project-filter">
        <button
          class="project-filter__button"
          type="button"
          :class="{ 'is-active': sortBy === 'latest' }"
          @click="sortBy = 'latest'"
        >
          Latest
        </button>
        <button
          class="project-filter__button"
          type="button"
          :class="{ 'is-active': sortBy === 'reactions' }"
          @click="sortBy = 'reactions'"
        >
          Most reactions
        </button>
      </div>

      <div class="project-filter" v-if="tags.length > 1">
        <button
          v-for="tag in tags"
          :key="tag"
          class="project-filter__button"
          type="button"
          :class="{ 'is-active': activeTag === tag }"
          @click="activeTag = tag"
        >
          {{ tag === 'All' ? tag : `#${tag}` }}
        </button>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading && posts.length === 0" class="blog-grid">
      <div v-for="n in 4" :key="n" class="post-card post-card--skeleton" aria-hidden="true">
        <div class="skeleton-line skeleton-line--short"></div>
        <div class="skeleton-line skeleton-line--title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line skeleton-line--short"></div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="blog-error">
      <p>{{ error }}</p>
      <button class="blog-error__retry" type="button" @click="reload">Try again</button>
    </div>

    <!-- Empty state -->
    <div v-else-if="visiblePosts.length === 0" class="blog-error">
      <p>No public articles match this filter.</p>
    </div>

    <!-- Article grid -->
    <template v-else>
      <div class="blog-grid">
        <a
          v-for="(post, i) in visiblePosts"
          :key="post.id"
          class="post-card"
          :style="{ '--accent': i % 2 === 0 ? 'var(--blue)' : 'var(--orange)' }"
          :href="post.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div
            v-if="post.cover"
            class="post-card__cover"
            :style="{ backgroundImage: `url(${post.cover})` }"
          ></div>

          <div class="post-card__body">
            <div class="post-card__top">
              <span class="post-card__date">{{ formatDate(post.publishedAt) }}</span>
              <span class="post-card__reading">{{ post.readingTime }} min read</span>
            </div>

            <h3 class="post-card__title">{{ post.title }}</h3>
            <p class="post-card__desc">{{ post.description || 'No description provided.' }}</p>

            <ul v-if="post.tags.length" class="post-card__tags">
              <li v-for="tag in post.tags.slice(0, 4)" :key="tag">#{{ tag }}</li>
            </ul>

            <div class="post-card__stats">
              <span>♥ {{ formatNumber(post.reactions) }}</span>
              <span>💬 {{ formatNumber(post.comments) }}</span>
            </div>
          </div>
        </a>
      </div>

      <div class="pagination" v-if="page > 1 || hasMore">
        <button type="button" :disabled="page === 1 || loading" @click="goToPage(page - 1)">
          Prev
        </button>
        <span>Page {{ page }}</span>
        <button type="button" :disabled="!hasMore || loading" @click="goToPage(page + 1)">
          {{ loading ? 'Loading…' : 'Next' }}
        </button>
      </div>

      <a
        class="blog-viewall"
        :href="`https://dev.to/${username}`"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View full profile on DEV Community"
        title="View full profile on DEV Community"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M7.5 7.5A1.5 1.5 0 0 1 9 6h8.25A1.5 1.5 0 0 1 18.75 7.5v9A1.5 1.5 0 0 1 17.25 18H9a1.5 1.5 0 0 1-1.5-1.5v-9Zm1.5 1.5v6h6.75v-1.5H12V9H9Zm10.5-3.75c.41 0 .75.34.75.75v12.75c0 .41-.34.75-.75.75H4.5a.75.75 0 0 1-.75-.75V6.75c0-.41.34-.75.75-.75h16.5Z"
          />
        </svg>
      </a>
    </template>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  username: { type: String, default: 'yyt0901' },
  pageSize: { type: Number, default: 8 },
})

const posts = ref([])
const loading = ref(true)
const error = ref('')
const page = ref(1)
const hasMore = ref(false)
const sortBy = ref('latest')
const activeTag = ref('All')

const formatNumber = (n) => {
  const num = Number(n) || 0
  if (num >= 1000) return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1)}k`
  return String(num)
}

const formatDate = (iso) => {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const normalizePost = (raw) => ({
  id: raw.id,
  title: raw.title,
  description: raw.description ?? '',
  url: raw.url ?? raw.canonical_url,
  cover: raw.cover_image ?? raw.social_image ?? '',
  publishedAt: raw.published_at ?? raw.published_timestamp,
  readingTime: raw.reading_time_minutes ?? 1,
  reactions: raw.public_reactions_count ?? raw.positive_reactions_count ?? 0,
  comments: raw.comments_count ?? 0,
  tags: Array.isArray(raw.tag_list)
    ? raw.tag_list
    : typeof raw.tag_list === 'string'
      ? raw.tag_list.split(',').map((t) => t.trim()).filter(Boolean)
      : [],
})

const fetchPage = async (pageNum) => {
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams({
      username: props.username,
      page: String(pageNum),
      per_page: String(props.pageSize),
    })
    const res = await fetch(`https://dev.to/api/articles?${params.toString()}`, {
      headers: { Accept: 'application/vnd.forem.api-v1+json' },
    })
    if (!res.ok) throw new Error(`DEV API request failed (${res.status}).`)
    const data = await res.json()
    if (!Array.isArray(data)) throw new Error('Unexpected response from DEV API.')

    const list = data.map(normalizePost)
    posts.value = pageNum === 1 ? list : [...posts.value, ...list]
    hasMore.value = list.length >= props.pageSize
    page.value = pageNum
  } catch (err) {
    error.value =
      err instanceof Error ? `Failed to load DEV articles: ${err.message}` : 'Failed to load DEV articles.'
  } finally {
    loading.value = false
  }
}

const goToPage = (n) => {
  if (n < 1) return
  fetchPage(n)
}

const reload = () => fetchPage(page.value || 1)

onMounted(() => fetchPage(1))
watch(() => props.username, () => {
  posts.value = []
  page.value = 1
  activeTag.value = 'All'
  fetchPage(1)
})

const tags = computed(() => {
  const set = new Set()
  posts.value.forEach((p) => p.tags.forEach((t) => set.add(t)))
  return ['All', ...Array.from(set).sort()]
})

const totalReactions = computed(() => posts.value.reduce((sum, p) => sum + (p.reactions || 0), 0))

const visiblePosts = computed(() => {
  let list = posts.value
  if (activeTag.value !== 'All') {
    list = list.filter((p) => p.tags.includes(activeTag.value))
  }
  if (sortBy.value === 'reactions') {
    list = [...list].sort((a, b) => b.reactions - a.reactions)
  }
  return list
})
</script>

<style scoped>
/*
  Shares design tokens/classes with the earlier GitHub/CSDN components:
  :root variables (--ink, --orange, --blue, --cream) and the global
  .section-shell / .section-heading / .section-index / .project-filter* /
  .pagination classes must already be loaded globally.

  Note: unlike the CSDN version, DEV Community's API
  (https://developers.forem.com/api) is public, documented, and CORS-enabled
  for GET requests — this component calls it directly from the browser, no
  server-side proxy required.
*/

.blog-section {
  padding-top: 50px;
}

.blog-summary {
  display: flex;
  gap: clamp(20px, 3vw, 40px);
  margin-bottom: 12px;
}

.blog-summary__item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.blog-summary__item strong {
  font: 700 clamp(1.8rem, 2.6vw, 2.6rem) / 1 'Bebas Neue', sans-serif;
  color: var(--ink);
}

.blog-summary__item span {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.blog-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 24px;
  margin: 0 0 12px;
}

.blog-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(20px, 3vw, 32px);
  margin-top: 24px;
}

.post-card {
  --accent: var(--blue);

  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 2px solid var(--ink);
  border-radius: 14px;
  background: var(--surface, #f4eadb);
  color: inherit;
  box-shadow: 8px 10px 0 var(--accent);
  transition: transform 220ms ease, box-shadow 220ms ease;
}

.post-card:hover,
.post-card:focus-visible {
  transform: translate(-3px, -4px) rotate(-0.4deg);
  box-shadow: 14px 18px 0 var(--accent);
}

.post-card__cover {
  height: 150px;
  background-position: center;
  background-size: cover;
  border-bottom: 2px solid var(--ink);
}

.post-card__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
}

.post-card__top {
  display: flex;
  justify-content: space-between;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgb(16 36 67 / 60%);
}

.post-card__title {
  margin: 0;
  font: 700 1.4rem/1.15 'Bebas Neue', sans-serif;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  word-break: break-word;
  color: black;
}

.post-card__desc {
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

.post-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.post-card__tags li {
  padding: 4px 9px;
  border: 1px solid var(--ink);
  border-radius: 999px;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--ink);
}

.post-card__stats {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-top: 10px;
  border-top: 1px solid rgb(16 36 67 / 20%);
  font-size: 0.72rem;
  font-weight: 700;
  color: rgb(16 36 67 / 60%);
}

/* Skeleton loading state */
.post-card--skeleton {
  gap: 12px;
  padding: 20px;
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

.blog-error {
  padding: 40px 24px;
  border: 2px dashed var(--ink);
  border-radius: 14px;
  text-align: center;
  color: rgb(16 36 67 / 78%);
}

.blog-error__retry {
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

.blog-section {
  position: relative;
}

.section-heading {
  position: relative;
  padding-right: 70px;
}

.blog-viewall {
  position: absolute;
  top: 10px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid black;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  color: black;
  box-shadow: 4px 6px 0 rgba(16, 36, 67, 0.15);
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.blog-viewall:hover,
.blog-viewall:focus-visible {
  transform: translate(-2px, -2px);
  box-shadow: 8px 10px 0 rgba(16, 36, 67, 0.15);
}

.blog-viewall svg {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

@media (max-width: 900px) {
  .blog-grid { grid-template-columns: 1fr; }
}

@media (max-width: 600px) {
  .blog-summary { gap: 20px; }
}
</style>
