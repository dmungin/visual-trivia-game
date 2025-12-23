<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { storeToRefs } from 'pinia'
import type { TriviaImage } from '../types'

const router = useRouter()
const gameStore = useGameStore()
const { config, assignedRounds, state } = storeToRefs(gameStore)

// Initialize rounds if empty (first visit)
onMounted(() => {
  if (assignedRounds.value.length === 0) {
    gameStore.initializeRounds()
  }
})

// Drag and Drop State
const draggedImage = ref<{ image: TriviaImage, fromRound: number } | null>(null)

function onDragStart(event: DragEvent, image: TriviaImage, roundIndex: number) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    draggedImage.value = { image, fromRound: roundIndex }
  }
}

function onDrop(_event: DragEvent, targetRoundIndex: number) {
  if (!draggedImage.value) return
  
  const { image, fromRound } = draggedImage.value
  
  if (fromRound === targetRoundIndex) return

  // Remove from source
  // Remove from source
  const sourceRound = assignedRounds.value[fromRound]
  if (sourceRound) {
    const sourceIndex = sourceRound.findIndex(img => img.id === image.id)
    if (sourceIndex !== -1) {
      sourceRound.splice(sourceIndex, 1)
    }
  }

  // Add to target
  const targetRound = assignedRounds.value[targetRoundIndex]
  if (targetRound) {
    targetRound.push(image)
  }
  
  draggedImage.value = null
}

function startGame() {
  gameStore.startGame(state.value.images) // Pass original list, but store uses assignedRounds
  router.push('/game')
}

function goBack() {
  router.push('/curator')
}

const saveName = ref('')

function saveGame() {
  if (saveName.value.trim()) {
    gameStore.saveGame(saveName.value.trim())
    saveName.value = ''
    alert('Game saved!')
  }
}
</script>

<template>
  <div class="round-assignment">
    <div class="header">
      <h2>Round Assignment</h2>
      <div class="controls">
        <div class="save-group">
          <input v-model="saveName" placeholder="Game Name" class="save-input" />
          <button @click="saveGame" :disabled="!saveName" class="save-btn">Save Game</button>
        </div>
        <button @click="router.push('/print-key')" class="secondary-btn">Print Key</button>
        <button @click="goBack" class="secondary-btn">Back</button>
        <button @click="startGame" class="primary-btn">Start Game</button>
      </div>
    </div>

    <div class="rounds-container">
      <div 
        v-for="(roundImages, index) in assignedRounds" 
        :key="index" 
        class="round-column"
        @dragover.prevent
        @drop="onDrop($event, index)"
      >
        <div class="round-header">
          <h3>Round {{ index + 1 }}</h3>
          <span class="count">{{ roundImages.length }} / {{ config.picturesPerRound }}</span>
        </div>
        
        <div class="images-list">
          <div 
            v-for="img in roundImages" 
            :key="img.id" 
            class="image-card"
            draggable="true"
            @dragstart="onDragStart($event, img, index)"
          >
            <img :src="img.url" :alt="img.name" loading="lazy" />
            <span class="name">{{ img.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.round-assignment {
  max-width: 98vw;
  margin: 0 auto;
  padding: 1rem;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  width: 100%;
  padding: 1rem 2rem; /* Reduced padding */
  background: rgba(0,0,0,0.3);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.05);
}

.header h2 {
  margin-bottom: 0;
  font-size: 2rem; /* Slightly smaller */
  white-space: nowrap;
}

.controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
}



.rounds-container {
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  flex: 1;
  padding-bottom: 1rem;
  align-items: flex-start;
}

.round-column {
  flex: 1 0 320px;
  min-width: 320px;
  background: rgba(30, 30, 30, 0.6);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: var(--shadow-lg);
  max-height: 100%;
}

.round-header {
  padding: 1.5rem;
  background: rgba(255,255,255,0.03);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.round-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--color-secondary);
}

.count {
  background: rgba(0,0,0,0.4);
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.9rem;
  color: var(--color-text-dim);
}

.images-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  grid-auto-rows: min-content;
  gap: 0.8rem;
  align-content: start;
}

.image-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem;
  background: rgba(255,255,255,0.05);
  border-radius: var(--radius-md);
  cursor: grab;
  border: 1px solid transparent;
  transition: all 0.2s;
  aspect-ratio: 0.8;
}

.image-card:hover {
  background: rgba(255,255,255,0.1);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}

.image-card:active {
  cursor: grabbing;
  transform: scale(0.98);
}

.image-card img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.name {
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  text-align: center;
  color: var(--color-text-dim);
}

button {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s;
}

.primary-btn {
  background: var(--gradient-primary);
  color: white;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
}

.secondary-btn {
  background: rgba(255,255,255,0.1);
  color: white;
  border: 1px solid rgba(255,255,255,0.1);
}

.secondary-btn:hover {
  background: rgba(255,255,255,0.15);
}

.save-group {
  display: flex;
  gap: 0.5rem;
  margin-right: auto; /* Pushes other buttons to the right */
  padding-right: 1rem;
  align-items: center;
}

.save-input {
  padding: 0.8rem 1rem;
  border-radius: 50px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(0,0,0,0.3);
  color: white;
  min-width: 200px;
}

.save-btn {
  background: var(--color-secondary);
  color: black;
}
</style>
