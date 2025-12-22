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

    <p class="instructions">Drag and drop images to rearrange them between rounds.</p>

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
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.controls {
  display: flex;
  gap: 1rem;
}

.instructions {
  margin-bottom: 2rem;
  color: #aaa;
}

.rounds-container {
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  flex: 1;
  padding-bottom: 1rem;
}

.round-column {
  flex: 0 0 300px;
  background: #333;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.round-header {
  padding: 1rem;
  background: #444;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.images-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.image-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  background: #222;
  border-radius: 4px;
  cursor: grab;
  border: 1px solid #555;
}

.image-card:active {
  cursor: grabbing;
}

.image-card img {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
}

.name {
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.primary-btn {
  background-color: var(--color-primary, #42b883);
  color: white;
}

.secondary-btn {
  background-color: #555;
  color: white;
}

button:hover {
  opacity: 0.9;
}

.save-group {
  display: flex;
  gap: 0.5rem;
  margin-right: 1rem;
  padding-right: 1rem;
  border-right: 1px solid #555;
}

.save-input {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #555;
  background: #222;
  color: white;
}

.save-btn {
  background-color: #2196F3;
  color: white;
}
</style>
