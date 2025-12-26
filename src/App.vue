<script setup lang="ts">
import { watch, computed } from 'vue'
import { useGameStore } from './stores/game'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'

// App.vue is now just a layout shell
const gameStore = useGameStore()
const { config } = storeToRefs(gameStore)
const route = useRoute()

const showHeader = computed(() => route.path !== '/game')

function updateTheme() {
  if (config.value.theme === 'christmas') {
    document.body.classList.add('theme-christmas')
  } else {
    document.body.classList.remove('theme-christmas')
  }
}

watch(() => config.value.theme, updateTheme, { immediate: true })
</script>

<template>
  <div class="app-container">
    <div class="snow-container">
       <div v-for="n in 50" :key="n" class="snowflake" :style="{
         left: Math.random() * 100 + 'vw',
         animationDuration: (Math.random() * 3 + 2) + 's',
         animationDelay: Math.random() * 5 + 's',
         width: (Math.random() * 5 + 2) + 'px',
         height: (Math.random() * 5 + 2) + 'px'
       }"></div>
    </div>
    
    <header v-if="showHeader">
      <h1 class="no-print">Image Trivia</h1>
    </header>
    
    <main>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  max-width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 1rem;
  text-align: center;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

header {
  margin-bottom: 2rem;
}

.game-placeholder {
  padding: 2rem;
  background: #333;
  border-radius: 8px;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.preview-item img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
}

@media print {
    .no-print {
        display: none;
    }
} 
</style>
