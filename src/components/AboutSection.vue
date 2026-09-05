<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
const props = defineProps({ isMobile: { type: Boolean, default: false } })
import { profile } from '../data/profile'
import { siteConfig } from '../data/siteConfig'
import { createBadgeScene, createPhoneScene } from '../three/createAboutObjects'

const section = ref(null)
const badgeCanvas = ref(null)
const phoneCanvas = ref(null)
const hasEntered = ref(false)
const phoneIsActive = ref(false)
const webglFailed = ref(false)

let badgeScene = null
let phoneScene = null
let sectionObserver = null
let badgeResizeObserver = null
let phoneResizeObserver = null

const badgePanel = ref(null)
const BADGE_ORIGIN_VERTICAL_OFFSET = 0.15

const syncBadgeStagePosition = () => {
  if (props.isMobile) return
  if (!section.value || !badgePanel.value) return

  const sectionRect = section.value.getBoundingClientRect()
  const panelRect = badgePanel.value.getBoundingClientRect()

  const centerX =
    panelRect.left -
    sectionRect.left +
    panelRect.width / 2

  const centerY =
    panelRect.top -
    sectionRect.top +
    panelRect.height / 2

  badgeScene?.resize({
    x: centerX,
    y: centerY - panelRect.height * BADGE_ORIGIN_VERTICAL_OFFSET,
  })
}

const togglePhone = () => {
  phoneIsActive.value = !phoneIsActive.value
  phoneScene?.setActive(phoneIsActive.value)
}

onMounted(async () => {
  await nextTick()

  if (!phoneCanvas.value) {
    console.error('Phone canvas ref is not ready.', { phoneCanvas: phoneCanvas.value })
    return
  }

    try {
      if (!props.isMobile) {
        try {
          badgeScene = await createBadgeScene(badgeCanvas.value, profile)
        } catch (error) {
          console.error('Unable to initialize the badge scene.', error)
          badgeScene = null
        }
      }

      phoneScene = createPhoneScene(phoneCanvas.value, profile)

      if (!props.isMobile) {
        badgeResizeObserver = new ResizeObserver(syncBadgeStagePosition)
        badgeResizeObserver.observe(badgePanel.value)
        window.addEventListener('resize', syncBadgeStagePosition)
        syncBadgeStagePosition()
      }

      phoneResizeObserver = new ResizeObserver(() => phoneScene?.resize())
      phoneResizeObserver.observe(phoneCanvas.value)
    } catch (error) {
      console.error('Unable to initialize the About 3D objects.', error)
      webglFailed.value = true
    }

  sectionObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting || hasEntered.value) return
      hasEntered.value = true
      if (!props.isMobile) badgeScene?.setActive(true)
      sectionObserver?.disconnect()
    },
    { threshold: 0.24 },
  )
  sectionObserver.observe(section.value)


})

onBeforeUnmount(() => {
  sectionObserver?.disconnect()
  badgeResizeObserver?.disconnect()
  phoneResizeObserver?.disconnect()
  if (!props.isMobile) badgeScene?.dispose()
  phoneScene?.dispose()
  window.removeEventListener('resize', syncBadgeStagePosition)
})

</script>

<template>
  <section
    id="about"
    ref="section"
    class="about-section"
    :class="{ 'has-entered': hasEntered, 'no-badge': props.isMobile }"
    aria-labelledby="about-title"
  >
    <div class="about-kicker" aria-hidden="true">
    </div>


    <div v-if="!props.isMobile" class="badge-stage">
      <canvas
        ref="badgeCanvas"
        class="about-webgl badge-webgl"
      ></canvas>
    </div>


    <div class="comic-layout">
      <article v-if="!props.isMobile" ref="badgePanel" class="comic-panel badge-panel" aria-label="Director identification badge">
        <div class="badge-panel__comic" aria-hidden="true">
          <div class="comic-speed-lines"></div>
        </div>
      </article>

      <article class="comic-panel bio-panel">
        <div class="halftone" aria-hidden="true"></div>
        <div class="bio-panel__inner">
          <span class="comic-label">{{ siteConfig.about.kicker }}</span>
          <h2 id="about-title">{{ siteConfig.about.heading }}</h2>
          <span class="brush-label">{{ siteConfig.about.note }}</span>

          <p class="bio-intro">
            {{ siteConfig.about.greeting }} <strong>{{ profile.name }}</strong> — a
            <mark>{{ profile.role }}</mark> {{ siteConfig.about.introBody }}
          </p>
          <p>{{ profile.intro }}</p>
          <p>{{ profile.approach }}</p>

          <ul class="discipline-list" aria-label="Directing disciplines">
            <li v-for="(discipline, index) in profile.disciplines" :key="discipline">
              <span>{{ String(index + 1).padStart(2, '0') }}</span>
              {{ discipline }}
            </li>
          </ul>

          <div class="comic-burst" aria-hidden="true">ACTION!</div>
        </div>
      </article>

      <article class="comic-panel phone-panel">
        <div class="comic-speed-lines comic-speed-lines--phone" aria-hidden="true"></div>
        <button
          type="button"
          class="phone-stage"
          :class="{ 'is-active': phoneIsActive }"
          :aria-pressed="phoneIsActive"
          @click="togglePhone"
        >
          <canvas ref="phoneCanvas" class="about-webgl phone-webgl"></canvas>
          <span class="contact-burst" aria-hidden="true">
            <span class="contact-burst__entry contact-burst__entry--email">
              <span class="contact-burst__label">Email</span>
              <span class="contact-burst__value" :data-text="profile.email">
                {{ profile.email }}
              </span>
            </span>
            <span class="contact-burst__entry contact-burst__entry--phone">
              <span class="contact-burst__label">Phone</span>
              <span class="contact-burst__value" :data-text="profile.phone">
                {{ profile.phone }}
              </span>
            </span>
          </span>
          <span class="phone-hint">
            {{ phoneIsActive ? siteConfig.about.phoneHintHidden : siteConfig.about.phoneHintVisible }}
          </span>
          <span v-if="phoneIsActive" class="sr-only">
            Email {{ profile.email }}. Phone {{ profile.phone }}. Based in {{ profile.location }}.
          </span>
        </button>
      </article>
    </div>
  </section>
</template>
