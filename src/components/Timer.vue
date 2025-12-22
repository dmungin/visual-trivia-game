<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps<{
  duration: number
  active: boolean
}>()

const emit = defineEmits(['timeout'])

const timeLeft = ref(props.duration)
let intervalId: number | null = null

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function startTimer() {
  if (intervalId) return
  
  timeLeft.value = props.duration
  intervalId = window.setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      stopTimer()
      emit('timeout')
    }
  }, 1000)
}

function stopTimer() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

watch(() => props.active, (newVal) => {
  if (newVal) {
    startTimer()
  } else {
    stopTimer()
    timeLeft.value = props.duration // Reset when stopped/inactive
  }
}, { immediate: true })

onUnmounted(() => {
  stopTimer()
})
</script>

<template>
  <div class="timer" :class="{ 'time-low': timeLeft <= 10 }">
    {{ formatTime(timeLeft) }}
  </div>
</template>

<style scoped>
.timer {
  font-family: monospace;
  font-size: 2rem;
  font-weight: bold;
  padding: 0.5rem 1rem;
  background: #333;
  border-radius: 8px;
  border: 2px solid #555;
}

.time-low {
  color: #ff4444;
  border-color: #ff4444;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
</style>
