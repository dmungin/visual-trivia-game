<script setup lang="ts">
import { useGameStore } from '../stores/game'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

const gameStore = useGameStore()
const { config, assignedRounds, state } = storeToRefs(gameStore)

const allRounds = computed(() => {
    // If we have assigned rounds, use them. 
    // Otherwise calculate from the flat list (fallback for auto-generated)
    const rounds = []
    
    if (assignedRounds.value && assignedRounds.value.length > 0) {
        return assignedRounds.value
    }

    // Fallback logic mirroring store logic
    for (let i = 0; i < config.value.rounds; i++) {
        const start = i * config.value.picturesPerRound
        const end = start + config.value.picturesPerRound
        const images = state.value.images.slice(start, end)
        if (images.length > 0) {
            rounds.push(images)
        }
    }
    return rounds
})

function onPrint() {
    window.print()
}

function onBack() {
    window.history.back()
}
</script>

<template>
  <div class="printable-key">
    <div class="no-print controls">
        <button @click="onBack">← Back</button>
        <button @click="onPrint" class="primary">Print Key</button>
    </div>

    <div class="print-content">
        <h1 class="no-print">Trivia Answer Key</h1>
        
        <div v-for="(round, rIndex) in allRounds" :key="rIndex" class="round-block">
            <h2>Round {{ rIndex + 1 }}</h2>
            <ol class="answer-list">
                <li v-for="img in round" :key="img.id">
                    <span class="name">{{ img.name }}</span>
                    <span class="meta" v-if="img.category">({{ img.category }})</span>
                </li>
            </ol>
        </div>
    </div>
  </div>
</template>

<style scoped>
.printable-key {
    background: white;
    color: black;
    min-height: 100vh;
    padding: 2rem;
    text-align: left;
}

.controls {
    margin-bottom: 2rem;
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: #f0f0f0;
    border-radius: 8px;
}

.controls button {
    padding: 0.5rem 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: white;
    color: black;
    cursor: pointer;
}

.controls button.primary {
    background: #2196F3;
    color: white;
    border: none;
}

h1 {
    text-align: center;
    border-bottom: 2px solid black;
    padding-bottom: 1rem;
    margin-bottom: 2rem;
}

.round-block {
    margin-bottom: 2rem;
    page-break-inside: avoid;
}

h2 {
    font-size: 1.5rem;
    border-bottom: 1px solid #ccc;
    margin-bottom: 1rem;
    padding-bottom: 0.25rem;
}

.answer-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem 2rem;
    padding-left: 1.5rem;
}

li {
    margin-bottom: 0.25rem;
    font-size: 1.1rem;
}

.meta {
    font-size: 0.9rem;
    color: #666;
    font-style: italic;
    margin-left: 0.5rem;
}

@media print {
    .no-print {
        display: none;
    }

    .printable-key {
        padding: 0;
    }

    .answer-list {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>
