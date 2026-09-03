<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import AboutSection from './components/AboutSection.vue'
import HeroScene from './components/HeroScene.vue'
import { loadAllProjects } from './data/projects'
import { siteConfig } from './data/siteConfig'
import { profile } from './data/profile'
import GithubRepos from './components/GithubRepos.vue'
import DevToBlog from './components/DevToBlog.vue'

const selectedCategory = ref('All')
const navHasBackground = ref(false)

const allProjects = ref([])
const loadingProjects = ref(false)

const currentPage = ref(1)
const perPage = 6

const totalPages = computed(() => Math.max(1, Math.ceil(filteredProjects.value.length / perPage)))

const categoryOptions = computed(() => {
  const values = allProjects.value.flatMap((project) => {
    if (!project || !project.category) return []
    return project.category
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  })

  return ['All', ...new Set(values)]
})

const filteredProjects = computed(() => {
  if (selectedCategory.value === 'All') return allProjects.value

  return allProjects.value.filter((project) => {
    const categories = (project.category || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    return categories.includes(selectedCategory.value)
  })
})

const paginatedProjects = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return filteredProjects.value.slice(start, start + perPage)
})

function goToPage(page) {
  currentPage.value = Math.min(Math.max(1, page), totalPages.value)
  window.scrollTo({ top: document.getElementById('portfolio').offsetTop - 80, behavior: 'smooth' })
}

let io = null
onMounted(() => {
  const section = document.getElementById('portfolio')
  if (!section) return

  io = new IntersectionObserver(async (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting && !allProjects.value.length && !loadingProjects.value) {
        loadingProjects.value = true
        const loaded = await loadAllProjects()
        allProjects.value = loaded
        loadingProjects.value = false
      }
    }
  }, { root: null, threshold: 0.1 })

  io.observe(section)
})

onBeforeUnmount(() => {
  if (io) io.disconnect()
})
</script>

<template>
  <div id="top">
    <header class="site-nav" :class="{ 'has-background': navHasBackground }">
      <a class="wordmark" href="#top" :aria-label="siteConfig.brand.homeLabel">
        <span>{{ siteConfig.brand.short }}</span>
        <p>{{ siteConfig.brand.tagline }}</p>
      </a>
      <nav aria-label="Primary navigation">
        <a href="#top">{{ siteConfig.nav.home }}</a>
        <a href="#about">{{ siteConfig.nav.about }}</a>
        <a href="#portfolio">{{ siteConfig.nav.portfolio }}</a>
        <a href="#blog">{{ siteConfig.nav.blog }}</a>
      </nav>

      <a class="download" :href="profile.resume" download>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M.5 9.5a.5.5 0 0 1 .5.5v2a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 15 12.5v-2a.5.5 0 0 1 1 0v2A2.5 2.5 0 0 1 13.5 15h-11A2.5 2.5 0 0 1 0 12.5v-2a.5.5 0 0 1 .5-.5zm6.35-7.2a.5.5 0 0 1 .7 0l3 3a.5.5 0 0 1-.7.7L8.5 4.21V11a.5.5 0 0 1-1 0V4.21L5.15 6.99a.5.5 0 1 1-.7-.7l3-3z"
          />
        </svg>
        <span>Download Resume</span>
      </a>
    </header>

    <main class="portfolio-page">
      <HeroScene @progress-end-change="navHasBackground = $event" />

      <GithubRepos :username="profile.githubUsername" />

      <!-- 分割线 -->
      <div class="divider"></div>

      <DevToBlog :username="profile.devCommunityUsername" />
    </main>

    <div class="divider"></div>

    <footer>
      <span>{{ siteConfig.footer.copyright }}</span>
      <a href="#top">{{ siteConfig.footer.backToTop }}</a>
    </footer>
  </div>
</template>

<style scoped>
.download {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 999px;
  color: white;
  text-decoration: none;
  transition: opacity 180ms ease, transform 180ms ease;
}

.download:hover,
.download:focus-visible {
  opacity: 0.9;
  transform: translateY(-1px);
}

.download svg {
  display: block;
  flex-shrink: 0;
}
</style>
