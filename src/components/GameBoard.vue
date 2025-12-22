<script setup lang="ts">
import { useGameStore } from '../stores/game'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import Timer from './Timer.vue'

const gameStore = useGameStore()
const { currentRoundImages, state, config } = storeToRefs(gameStore)

const showAnswers = ref(false)

function onStartRound() {
  gameStore.startRound()
  showAnswers.value = false
}

function onTimeout() {
  gameStore.timeoutRound()
}

function onNextRound() {
  gameStore.endRound()
  showAnswers.value = false
}
</script>

<template>
  <div class="game-board">
    <div class="header">
      <h2>Round {{ state.currentRound }} / {{ config.rounds }}</h2>
      <Timer 
        :duration="config.timePerRound" 
        :active="state.roundStatus === 'active'"
        @timeout="onTimeout"
      />
    </div>

    <div class="game-area">
      <!-- Overlay for Ready/Complete states -->
      <div v-if="state.roundStatus !== 'active' && !showAnswers" class="overlay">
        <div v-if="state.roundStatus === 'ready'" class="overlay-content">
          <h3>Ready?</h3>
          <button @click="onStartRound" class="start-btn">Start Round</button>
        </div>
        <div v-else-if="state.roundStatus === 'complete'" class="overlay-content">
          <h3>Round Over!</h3>
          <p>Time's up!</p>
        </div>
      </div>

      <div 
        class="grid" 
        :class="{ blurred: state.roundStatus !== 'active' && !showAnswers }"
        :style="{ '--cols': Math.ceil(Math.sqrt(config.picturesPerRound)) }"
      >
        <div 
          v-for="(img, index) in currentRoundImages" 
          :key="img.id" 
          class="card"
        >
          <div class="image-wrapper">
            <img :src="img.url" :alt="img.name" />
            <div class="number-badge">{{ index + 1 }}</div>
            <div v-if="showAnswers" class="answer-label">
              {{ img.name }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="controls">
      <div v-if="state.roundStatus === 'complete'" class="control-group">
        <button @click="showAnswers = !showAnswers" class="toggle-answers-btn">
          {{ showAnswers ? 'Hide Answers' : 'Show Answers' }}
        </button>
        <button 
          @click="onNextRound"
        >
          {{ state.currentRound < config.rounds ? 'Next Round' : 'Finish Game' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-board {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1rem 2rem;
  background: rgba(0,0,0,0.3);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(5px);
}

.game-area {
  position: relative;
  flex: 1;
  background: rgba(255,255,255,0.02);
  border-radius: var(--radius-lg);
  padding: 2rem;
  transition: all 0.3s;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
  transition: filter 0.5s ease;
}

.grid.blurred {
  filter: blur(20px) brightness(0.7);
  pointer-events: none;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  border-radius: var(--radius-lg);
}

.overlay-content {
  background: rgba(30, 30, 30, 0.85); /* Slightly clearer */
  padding: 3rem 5rem;
  border-radius: var(--radius-lg);
  text-align: center;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.overlay-content h3 {
  font-size: 3.5rem;
  margin: 0 0 1rem 0;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

.start-btn {
  font-size: 1.8rem;
  padding: 1rem 4rem;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
  transition: transform 0.2s, box-shadow 0.2s;
}

.start-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 30px rgba(0,0,0,0.3);
}

.toggle-answers-btn {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
}

.toggle-answers-btn:hover {
  background: rgba(255,255,255,0.2);
}

.answer-label {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 0.8rem;
  text-align: center;
  font-weight: 700;
  font-size: 1.2rem;
  z-index: 5;
  backdrop-filter: blur(4px);
}

.card {
  position: relative;
  aspect-ratio: 1;
  background: #1a1a1a;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid rgba(255,255,255,0.05);
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0,0,0,0.3);
  border-color: rgba(255,255,255,0.2);
}

.image-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.card:hover img {
  transform: scale(1.05);
}

.number-badge {
  position: absolute;
  top: 15px;
  left: 15px;
  width: 45px;
  height: 45px;
  background: var(--gradient-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  font-weight: 800;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  z-index: 2;
  border: 2px solid rgba(255,255,255,0.2);
}

.controls {
  margin-top: 2rem;
  min-height: 80px;
  display: flex;
  justify-content: center;
}

.control-group {
  display: flex;
  gap: 1.5rem;
  background: rgba(0,0,0,0.4);
  padding: 1rem 2rem;
  border-radius: 50px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.1);
}

button {
  padding: 0.8rem 2rem;
  font-size: 1.1rem;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  color: white;
  border: none;
}

/* Primary Action Button Style */
button:not(.toggle-answers-btn) {
  background: var(--gradient-primary);
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

button:not(.toggle-answers-btn):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
}
</style>
