<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '../stores/game'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close'])

const gameStore = useGameStore()
const { apiConfig } = storeToRefs(gameStore)

const apiKeyInput = ref(apiConfig.value.apiKey)
const cxInput = ref(apiConfig.value.searchEngineId)

function onSave() {
  gameStore.updateApiConfig(apiKeyInput.value, cxInput.value)
  emit('close')
}

// Watch for external updates or initial open? 
// Actually, when it opens, we want to reflect store state. 
// But since we use v-model on local refs, we should sync them when modal opens or store changes.
// A simpler way is to just sync on mount or use a watcher on `isOpen`.

import { watch } from 'vue'
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    apiKeyInput.value = apiConfig.value.apiKey
    cxInput.value = apiConfig.value.searchEngineId
  }
})

</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-content glass-card">
        <div class="modal-header">
           <h3>Settings</h3>
           <button class="close-btn" @click="emit('close')">×</button>
        </div>
       
        <div class="modal-body">
          <p class="description">
              Configure your Google Custom Search JSON API keys. 
              These are required for image searching. Keys are saved to your browser's local storage.
          </p>

          <div class="form-group">
            <label>API Key</label>
            <input v-model="apiKeyInput" type="password" placeholder="AIza..." />
          </div>

          <div class="form-group">
             <label>Search Engine ID</label>
             <input v-model="cxInput" placeholder="0123..." />
          </div>
        </div>

        <div class="modal-footer">
           <button class="save-btn" @click="onSave">Save Settings</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #2a2a2a;
  width: 90%;
  max-width: 500px;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.1);
}

.modal-header {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255,255,255,0.05);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #aaa;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: white;
}

.modal-body {
  padding: 2rem 1.5rem;
}

.description {
  color: #aaa;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.form-group {
    margin-bottom: 1.2rem;
}

label {
   display: block;
   margin-bottom: 0.5rem;
   font-size: 0.9rem;
   color: #ccc;
}

input {
   width: 100%;
   padding: 0.8rem;
   background: rgba(0,0,0,0.3);
   border: 1px solid rgba(255,255,255,0.1);
   border-radius: var(--radius-md);
   color: white;
}

input:focus {
    border-color: var(--color-primary);
    outline: none;
}

.modal-footer {
    padding: 1.5rem;
    background: rgba(0,0,0,0.2);
    display: flex;
    justify-content: flex-end;
}

.save-btn {
    background: var(--gradient-primary);
    color: white;
    border: none;
    padding: 0.8rem 2rem;
    border-radius: 50px;
    font-weight: bold;
    cursor: pointer;
}

.save-btn:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
</style>
