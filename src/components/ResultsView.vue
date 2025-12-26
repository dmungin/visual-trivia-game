<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { storeToRefs } from 'pinia'

const router = useRouter()
const gameStore = useGameStore()
const { assignedRounds } = storeToRefs(gameStore)

function onBackToMenu() {
  router.push('/')
}

function onPrintKey() {
  router.push('/print-key')
}
</script>

<template>
  <div class="results-view">
    <div class="results-header">
      <h1>Game Over</h1>
      <p>Here are the correct answers for all rounds.</p>
      
      <div class="action-buttons">
        <button @click="onBackToMenu" class="secondary-btn">Back to Menu</button>
        <button @click="onPrintKey" class="primary-btn">Print Answer Key</button>
      </div>
    </div>

    <div class="rounds-summary">
      <div v-for="(roundImages, index) in assignedRounds" :key="index" class="round-block">
        <h3>Round {{ index + 1 }}</h3>
        <div class="image-grid">
          <div v-for="(img, idx) in roundImages" :key="img.id" class="result-card glass-card">
            <div class="image-wrapper">
              <span class="img-number">{{ idx + 1 }}</span>
              <img :src="img.url" :alt="img.name" loading="lazy" />
            </div>
            <div class="answer-reveal">
              {{ img.name }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.results-view {
  max-width: 98vw;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.results-header {
  margin-bottom: 3rem;
  background: rgba(0,0,0,0.4);
  padding: 2rem;
  border-radius: var(--radius-lg);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.1);
}

h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  background: var(--gradient-primary);
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2rem;
}

button {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.primary-btn {
  background: var(--gradient-primary);
  color: white;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.4);
}

.secondary-btn {
  background: rgba(255,255,255,0.1);
  color: white;
  border: 1px solid rgba(255,255,255,0.1);
}

.secondary-btn:hover {
  background: rgba(255,255,255,0.15);
}

.round-block {
  margin-bottom: 4rem;
}

.round-block h3 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
  text-align: left;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  padding-bottom: 0.5rem;
  color: var(--color-secondary);
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.result-card {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: transform 0.2s;
}

.result-card:hover {
  transform: translateY(-5px);
}

.image-wrapper {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  aspect-ratio: 1;
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-number {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 30px;
  height: 30px;
  background: var(--gradient-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  box-shadow: 0 2px 5px rgba(0,0,0,0.5);
}

.answer-reveal {
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
  background: rgba(255,255,255,0.05);
  padding: 0.5rem;
  border-radius: var(--radius-sm);
}
</style>
