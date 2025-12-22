<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { storeToRefs } from 'pinia'

const router = useRouter()
const gameStore = useGameStore()
const { config, savedGames } = storeToRefs(gameStore)

function onNext() {
  router.push('/curator')
}

function onLoadGame(index: number) {
  const game = savedGames.value[index]
  if (game) {
    gameStore.loadGame(game)
    router.push('/assign') // Go straight to assignment as game is ready
  }
}

function onDeleteGame(index: number) {
  gameStore.deleteGame(index)
}
</script>

<template>
  <div class="setup-container">
    <div class="game-setup">
      <h2>Game Setup</h2>
      
      <div class="form-group">
        <label for="rounds">Rounds:</label>
        <input id="rounds" type="number" v-model="config.rounds" min="1" max="20" />
      </div>

      <div class="form-group">
        <label for="pictures">Pictures per Round:</label>
        <input id="pictures" type="number" v-model="config.picturesPerRound" min="1" max="9" />
      </div>

      <div class="form-group">
        <label for="timer">Time per Round (seconds):</label>
        <input id="timer" type="number" v-model="config.timePerRound" min="10" max="300" />
      </div>

      <button class="next-btn" @click="onNext">Next: Select Images</button>
    </div>

    <div class="saved-configs" v-if="savedGames.length > 0">
      <h3>Saved Games</h3>
      <div v-for="(saved, index) in savedGames" :key="index" class="saved-item">
        <div class="saved-info">
          <strong>{{ saved.name }}</strong>
          <span>{{ saved.config.rounds }} rounds, {{ saved.images.length }} images</span>
          <span class="date">{{ new Date(saved.createdAt).toLocaleDateString() }}</span>
        </div>
        <div class="saved-actions">
          <button @click="onLoadGame(index)">Load</button>
          <button class="delete-btn" @click="onDeleteGame(index)">×</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.setup-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
}

.game-setup, .saved-configs {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background: #333;
  border-radius: 8px;
}

.saved-configs {
  background: #2a2a2a;
}

.form-group {
  display: flex;
  flex-direction: column;
  text-align: left;
  margin-bottom: 1rem;
}

label {
  margin-bottom: 0.5rem;
  font-weight: bold;
}

input {
  padding: 0.5rem;
  font-size: 1rem;
  border-radius: 4px;
  border: 1px solid #555;
  background: #222;
  color: white;
}


button {
  padding: 0.5rem 1rem;
  background-color: var(--color-primary, #42b883);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.next-btn {
  width: 100%;
  margin-top: 1.5rem;
  padding: 1rem;
  font-size: 1.2rem;
}

.saved-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #222;
  margin-bottom: 0.5rem;
  border-radius: 4px;
}

.saved-info {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.saved-actions {
  display: flex;
  gap: 0.5rem;
}

.delete-btn {
  background: #ff4444;
  padding: 0.25rem 0.5rem;
}
</style>
