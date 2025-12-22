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
  font-family: 'Inter', monospace;
  font-size: 2.5rem;
  font-weight: 700;
  padding: 0.5rem 1.5rem;
  background: rgba(0, 0, 0, 0.5);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--color-text);
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.time-low {
  color: #ff4444;
  border-color: rgba(255, 68, 68, 0.3);
  background: rgba(255, 68, 68, 0.1);
  box-shadow: 0 0 20px rgba(255, 68, 68, 0.4);
  text-shadow: 0 0 10px rgba(255, 68, 68, 0.5);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
