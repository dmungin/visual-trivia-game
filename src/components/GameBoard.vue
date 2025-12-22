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
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.game-area {
  position: relative;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
  transition: filter 0.3s ease;
}

.grid.blurred {
  filter: blur(10px);
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
  background: rgba(0, 0, 0, 0.2); /* Slight dim */
}

.overlay-content {
  background: rgba(0, 0, 0, 0.8);
  padding: 2rem 4rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 8px 16px rgba(0,0,0,0.5);
  border: 1px solid #555;
}

.overlay-content h3 {
  font-size: 2.5rem;
  margin: 0 0 1rem 0;
  color: white;
}

.start-btn {
  font-size: 1.5rem;
  padding: 1rem 3rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.start-btn:hover {
  filter: brightness(1.1);
}

.round-over-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.toggle-answers-btn {
  background: #2196F3;
  font-size: 1.2rem;
}

.answer-label {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 0.5rem;
  text-align: center;
  font-weight: bold;
  font-size: 1.1rem;
  z-index: 5;
}

.card {
  position: relative;
  aspect-ratio: 1;
  background: #222;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
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
}

.number-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 40px;
  height: 40px;
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.controls {
  margin-top: 2rem;
  min-height: 60px; /* Prevent layout jump */
  display: flex;
  justify-content: center;
}

.control-group {
  display: flex;
  gap: 1rem;
}

button {
  padding: 1rem 2rem;
  font-size: 1.2rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}
</style>
