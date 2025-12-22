import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GameConfig, GameState, TriviaImage, SavedGame } from '../types'

export const useGameStore = defineStore('game', () => {
    // Config
    const config = ref<GameConfig>({
        rounds: 3,
        picturesPerRound: 30,
        timePerRound: 600,
        theme: 'default',
    })

    const savedGames = ref<SavedGame[]>([])

    // State
    const state = ref<GameState>({
        currentRound: 0,
        score: 0,
        isPlaying: false,
        images: [],
        roundStatus: 'ready',
    })

    // Manual Round Assignment
    // Array of rounds, each containing an array of images
    const assignedRounds = ref<TriviaImage[][]>([])


    // Computed
    const currentRoundImages = computed(() => {
        if (!state.value.isPlaying) return []

        // If we have manually assigned rounds, use them
        if (assignedRounds.value.length > 0) {
            const roundIndex = state.value.currentRound - 1
            return assignedRounds.value[roundIndex] || []
        }

        // Fallback to automatic slicing (legacy behavior or if no assignment happened)
        const start = (state.value.currentRound - 1) * config.value.picturesPerRound
        const end = start + config.value.picturesPerRound
        return state.value.images.slice(start, end)
    })

    const totalImagesNeeded = computed(() => config.value.rounds * config.value.picturesPerRound)

    const isValidGame = computed(() => {
        // Check count
        if (state.value.images.length !== totalImagesNeeded.value) return false

        // Check uniqueness (names)
        const names = state.value.images.map(img => img.name.toLowerCase().trim())
        const uniqueNames = new Set(names)
        if (uniqueNames.size !== names.length) return false

        return true
    })

    const validationErrors = computed(() => {
        const errors: string[] = []
        if (state.value.images.length !== totalImagesNeeded.value) {
            errors.push(`Need ${totalImagesNeeded.value} images, but have ${state.value.images.length}.`)
        }

        const names = state.value.images.map(img => img.name.toLowerCase().trim())
        const uniqueNames = new Set(names)
        if (uniqueNames.size !== names.length) {
            errors.push('Duplicate names found. Each image must have a unique name.')
        }

        return errors
    })

    // Actions
    function setConfig(newConfig: Partial<GameConfig>) {
        config.value = { ...config.value, ...newConfig }
    }

    function saveGame(name: string) {
        const newSave: SavedGame = {
            name,
            config: { ...config.value },
            images: [...state.value.images],
            assignedRounds: JSON.parse(JSON.stringify(assignedRounds.value)), // Deep copy
            createdAt: Date.now()
        }
        savedGames.value.push(newSave)
        localStorage.setItem('trivia_saved_games', JSON.stringify(savedGames.value))
    }

    function loadSavedGames() {
        const saved = localStorage.getItem('trivia_saved_games')
        if (saved) {
            try {
                savedGames.value = JSON.parse(saved)
            } catch (e) {
                console.error('Failed to parse saved games', e)
            }
        }
    }

    function loadGame(savedGame: SavedGame) {
        config.value = { ...savedGame.config }
        state.value.images = [...savedGame.images]
        assignedRounds.value = JSON.parse(JSON.stringify(savedGame.assignedRounds))
    }

    function deleteGame(index: number) {
        savedGames.value.splice(index, 1)
        localStorage.setItem('trivia_saved_games', JSON.stringify(savedGames.value))
    }

    function initializeRounds() {
        // Initialize empty rounds based on config
        assignedRounds.value = Array.from({ length: config.value.rounds }, () => [])

        // Distribute currently selected images sequentially as a default
        let imageIndex = 0
        for (let i = 0; i < config.value.rounds; i++) {
            for (let j = 0; j < config.value.picturesPerRound; j++) {
                if (imageIndex < state.value.images.length) {
                    const img = state.value.images[imageIndex]
                    const targetRound = assignedRounds.value[i]
                    if (img && targetRound) {
                        targetRound.push(img)
                    }
                    imageIndex++
                }
            }
        }
    }

    function updateRoundAssignment(roundIndex: number, images: TriviaImage[]) {
        if (assignedRounds.value[roundIndex]) {
            assignedRounds.value[roundIndex] = images
        }
    }

    function setImages(selectedImages: TriviaImage[]) {
        state.value.images = [...selectedImages]
        // Reset assignments when images change
        assignedRounds.value = []
    }

    function startGame(selectedImages: TriviaImage[]) {
        // If we haven't done manual assignment, just use the selected images directly
        // But if we have assignedRounds, we trust that structure.
        // However, the GameBoard expects state.value.images to be the source of truth for ALL images?
        // Actually, currentRoundImages computed property handles the logic.

        state.value.images = [...selectedImages] // Keep a flat list for reference

        // If assignedRounds is empty (skipped assignment step?), auto-fill
        if (assignedRounds.value.length === 0) {
            initializeRounds()
        }

        state.value.currentRound = 1
        state.value.score = 0
        state.value.isPlaying = true
        state.value.roundStatus = 'ready'
    }

    function startRound() {
        state.value.roundStatus = 'active'
    }

    function timeoutRound() {
        state.value.roundStatus = 'complete'
    }

    function endRound() {
        if (state.value.currentRound < config.value.rounds) {
            state.value.currentRound++
            state.value.roundStatus = 'ready'
        } else {
            endGame()
        }
    }

    function endGame() {
        state.value.isPlaying = false
        state.value.roundStatus = 'complete'
    }

    // Initialize
    loadSavedGames()

    return {
        config,
        savedGames,
        state,
        assignedRounds,
        currentRoundImages,
        totalImagesNeeded,
        isValidGame,
        validationErrors,
        setConfig,
        saveGame,
        loadGame,
        deleteGame,
        initializeRounds,
        updateRoundAssignment,
        setImages,
        startGame,
        startRound,
        timeoutRound,
        endRound,
        endGame,
    }
})
