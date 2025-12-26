<script setup lang="ts">
import { useGameStore } from '../stores/game'
import { storeToRefs } from 'pinia'
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import Timer from './Timer.vue'

import { useRouter } from 'vue-router'

const gameStore = useGameStore()
const router = useRouter()
const { currentRoundImages, state, config } = storeToRefs(gameStore)

const showAnswers = ref(false)
const optimalCols = ref(4)

function calculateOptimalGrid() {
  if (!currentRoundImages.value.length) return
  
  // Approximate available space
  // We can use window dimensions or the container if available
  const width = window.innerWidth * 0.98 // 98vw
  const height = window.innerHeight - 180 // Approximate header/footer
  const count = currentRoundImages.value.length
  
  let bestSize = 0
  let bestCols = Math.ceil(Math.sqrt(count)) // Default square-ish start
  
  // Try all reasonable column counts
  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols)
    const cardWidth = (width / cols) - 16 // Account for gaps approx
    // Aspect ratio 1:1, so height = width
    const cardHeight = cardWidth
    
    // Check if it fits vertically
    if (rows * (cardHeight + 16) <= height) {
       // It fits, is it the biggest so far?
       if (cardWidth > bestSize) {
         bestSize = cardWidth
         bestCols = cols
       }
    }
  }
  
  // Fallback: if nothing fits 'perfectly' (e.g. too many items), 
  // try to fill width decent amount, scroll is acceptable but we try to avoid.
  // The logic above is strictly "fit in H", which might fail for 30 items on small screen.
  // If bestSize is still 0, allow scrolling by using the square root heuristic or a max-height fit.
  if (bestSize === 0) {
      // Find layout that minimizes vertical overflow or balances ratio
      // Square root heuristic adjusted for screen aspect ratio 16:9 ~ 1.77
      bestCols = Math.ceil(Math.sqrt(count * 1.77))
  }

  optimalCols.value = bestCols
}

onMounted(() => {
  window.addEventListener('resize', calculateOptimalGrid)
  calculateOptimalGrid()
})

onUnmounted(() => {
  window.removeEventListener('resize', calculateOptimalGrid)
})

watch(() => currentRoundImages.value.length, calculateOptimalGrid)

function onStartRound() {
  gameStore.startRound()
  showAnswers.value = false
}

function onPauseToggle() {
    if (state.value.roundStatus === 'active') {
        gameStore.pauseRound()
    } else if (state.value.roundStatus === 'paused') {
        gameStore.resumeRound()
    }
}

const timerStatus = computed(() => {
    switch (state.value.roundStatus) {
        case 'active': return 'running'
        case 'paused': return 'paused'
        default: return 'stopped'
    }
})

function onTimeout() {
  gameStore.timeoutRound()
}

function onNextRound() {
  if (state.value.currentRound < config.value.rounds) {
     gameStore.endRound()
     showAnswers.value = false
  } else {
     gameStore.endGame()
     router.push('/results')
  }
}
</script>

<template>
  <div class="game-board" ref="containerRef">
    <div class="header">
      <h2>Round {{ state.currentRound }} / {{ config.rounds }}</h2>
      <div class="header-actions">
          <div v-if="state.roundStatus === 'active' || state.roundStatus === 'paused'" class="header-controls">
            <button @click="onPauseToggle" class="pause-btn">
                {{ state.roundStatus === 'paused' ? 'Resume' : 'Pause' }}
            </button>
            <button @click="onTimeout" class="secondary-btn end-round-btn">
            End Round
            </button>
          </div>
        <Timer 
            :duration="config.timePerRound" 
            :status="timerStatus"
            @timeout="onTimeout"
        />
      </div>
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
        :class="{ blurred: state.roundStatus !== 'active' && state.roundStatus !== 'paused' && !showAnswers }"
        :style="{ '--cols': optimalCols }"
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
  max-width: 98vw;
  margin: 0 auto;
  padding: 0.5rem;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Prevent scrolling on the main container */
}

.header {
  flex-shrink: 0; /* Header doesn't shrink */
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding: 0.5rem 1.5rem;
  background: rgba(0,0,0,0.3);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(5px);
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.header-controls {
    display: flex;
    gap: 1rem;
}

.header h2 {
    font-size: 1.2rem;
    margin: 0;
}

.game-area {
  position: relative;
  flex: 1; /* Take up all remaining space */
  background: rgba(255,255,255,0.02);
  border-radius: var(--radius-lg);
  padding: 1rem;
  transition: all 0.3s;
  display: flex; /* Use flex to center the grid if needed */
  flex-direction: column;
  overflow: hidden; 
}

.grid {
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  gap: 0.8rem;
  width: 100%;
  height: 100%;
  transition: filter 0.5s ease;
  overflow-y: auto; /* Scroll inside grid if absolutely necessary, but aiming for fit */
  align-content: start; /* Pack items at the start */
}

/* Dynamic adjustment for very large counts could be handled via class, 
   but minmax(140px, 1fr) usually fits ~30 on 1080p if height is sufficient.
   Let's ensure the card aspect ratio is maintained but flexible. */

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
}

.overlay-content {
  background: rgba(30, 30, 30, 0.85);
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
  background-clip: text;
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
  color: white;
  background: rgba(0,0,0);
  padding: 0.1rem; /* Smaller padding */
  text-align: center;
  font-weight: 700;
  font-size: 0.6rem; /* Smaller font */
  z-index: 5;
  backdrop-filter: blur(4px);
}

.card {
  position: relative;
  aspect-ratio: 1;
  background: #1a1a1a;
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid rgba(255,255,255,0.05);
}

.card:hover {
  transform: translateY(-3px); /* Less movement */
  box-shadow: 0 10px 20px rgba(0,0,0,0.3);
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
  top: 2px; /* Closer to corner */
  left: 2px;
  width: 30px; /* Smaller badge */
  height: 30px;
  background: var(--gradient-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 800;
  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  z-index: 6;
  border: 2px solid rgba(255,255,255,0.2);
}

.controls {
  flex-shrink: 0; /* Controls don't shrink */
  padding-top: 0.5rem;
  min-height: auto; /* Remove fixed min-height */
  display: flex;
  justify-content: center;
}

.control-group {
  display: flex;
  gap: 1rem;
  background: rgba(0,0,0,0.4);
  padding: 0.5rem 1.5rem; /* Compact padding */
  border-radius: 50px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.1);
}

button {
  padding: 0.6rem 1.5rem; /* Smaller button padding */
  font-size: 1rem;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  color: white;
  border: none;
}

/* Primary Action Button Style */
button:not(.toggle-answers-btn):not(.end-round-btn) {
  background: var(--gradient-primary);
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

button:not(.toggle-answers-btn):not(.end-round-btn):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
}

.end-round-btn {
  background: rgba(255, 68, 68, 0.2);
  border: 1px solid rgba(255, 68, 68, 0.4);
  color: #ffaaaa;
}

.end-round-btn:hover {
  background: rgba(255, 68, 68, 0.3);
  border-color: #ff4444;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(255, 68, 68, 0.2);
}

.pause-btn {
    background: rgba(255, 193, 7, 0.2);
    border: 1px solid rgba(255, 193, 7, 0.4);
    color: #ffea00;
}

.pause-btn:hover {
    background: rgba(255, 193, 7, 0.3);
    border-color: #ffea00;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(255, 193, 7, 0.2);
}
</style>
