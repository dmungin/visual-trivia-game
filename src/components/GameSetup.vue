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

function onPlayGame(index: number) {
  const game = savedGames.value[index]
  if (game) {
    gameStore.loadGame(game)
    router.push('/assign') // Go straight to assignment
  }
}

function onEditGame(index: number) {
  const game = savedGames.value[index]
  if (game) {
    gameStore.loadGame(game)
    // Stay here, form is reactive and will update with loaded config
    // Optionally scrolling to top or giving feedback could be nice
  }
}

function onDeleteGame(index: number) {
  gameStore.deleteGame(index)
}
</script>

<template>
  <div class="setup-container">
    <div class="glass-card game-setup">
      <h2>Game Setup</h2>
      
      <div class="setup-form">
        <div class="form-group">
          <label for="rounds">Rounds</label>
          <div class="input-wrapper">
             <input id="rounds" type="number" v-model="config.rounds" min="1" max="20" />
             <span class="unit">rounds</span>
          </div>
        </div>

        <div class="form-group">
          <label for="pictures">Pictures per Round</label>
          <div class="input-wrapper">
             <input id="pictures" type="number" v-model="config.picturesPerRound" min="1" max="9" />
             <span class="unit">imgs</span>
          </div>
        </div>

        <div class="form-group">
          <label for="timer">Time per Round</label>
          <div class="input-wrapper">
             <input id="timer" type="number" v-model="config.timePerRound" min="10" max="300" step="10" />
             <span class="unit">sec</span>
          </div>
        </div>

        <div class="form-group">
          <label for="theme">Theme</label>
           <div class="input-wrapper">
             <select id="theme" v-model="config.theme">
               <option value="default">Default Dark</option>
               <option value="christmas">🎄 Christmas</option>
             </select>
          </div>
        </div>
      </div>

      <button class="next-btn primary-gradient" @click="onNext">Start Game Creation →</button>
    </div>

    <div class="saved-configs glass-card" v-if="savedGames.length > 0">
      <h3>Saved Games</h3>
      <div class="saved-list">
        <div v-for="(saved, index) in savedGames" :key="index" class="saved-item">
          <div class="saved-info">
            <strong>{{ saved.name }}</strong>
            <span class="meta">{{ saved.config.rounds }} rounds • {{ new Date(saved.createdAt).toLocaleDateString() }}</span>
          </div>
          <div class="saved-actions">
            <button class="icon-btn edit" @click="onEditGame(index)" title="Edit Configuration">✎</button>
            <button class="icon-btn play" @click="onPlayGame(index)" title="Play Now">▶</button>
            <button class="icon-btn delete" @click="onDeleteGame(index)" title="Delete">×</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.setup-container {
  display: flex;
  flex-direction: column;
  gap: 3rem;
  align-items: center;
  max-width: 500px;
  margin: 0 auto;
  width: 100%;
}

.game-setup, .saved-configs {
  width: 100%;
  padding: 2.5rem;
  text-align: left;
}

h2 {
  margin-bottom: 2rem;
  text-align: center;
}

.setup-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-size: 0.9rem;
  color: var(--color-text-dim);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: var(--color-surface);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: var(--radius-md);
  padding: 0 1rem;
  transition: border-color 0.2s;
}

.input-wrapper:focus-within {
  border-color: var(--color-primary);
}

input, select {
  flex: 1;
  padding: 0.8rem 0;
  font-size: 1.1rem;
  background: transparent;
  border: none;
  color: white;
  outline: none;
}

option {
  background: #222;
  color: white;
}

.unit {
  color: var(--color-text-dim);
  font-size: 0.9rem;
}

.next-btn {
  width: 100%;
  margin-top: 2rem;
  padding: 1rem;
  font-size: 1.1rem;
  border-radius: 50px;
  background: var(--gradient-primary);
  border: none;
  color: white;
  box-shadow: 0 4px 15px rgba(124, 77, 255, 0.4);
}

.next-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(124, 77, 255, 0.6);
}

.saved-configs h3 {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  color: var(--color-secondary);
}

.saved-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.saved-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255,255,255,0.05);
  border-radius: var(--radius-md);
  transition: background 0.2s;
}

.saved-item:hover {
  background: rgba(255,255,255,0.08);
}

.saved-info {
  display: flex;
  flex-direction: column;
}

.meta {
  font-size: 0.8rem;
  color: var(--color-text-dim);
  margin-top: 0.2rem;
}

.saved-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.2s;
  cursor: pointer;
}

.icon-btn.edit {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.icon-btn.edit:hover {
  background: var(--color-primary);
}

.icon-btn.play {
  background: var(--color-secondary);
  color: black;
}

.icon-btn.play:hover {
  transform: scale(1.1);
  box-shadow: 0 0 10px rgba(3, 218, 198, 0.4);
}

.icon-btn.delete {
  background: rgba(255,255,255,0.05);
  color: var(--color-text-dim);
}

.icon-btn.delete:hover {
  background: var(--color-error);
  color: white;
}
</style>
