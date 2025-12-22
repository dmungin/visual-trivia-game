<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/game';
import { storeToRefs } from 'pinia';
import { ImageSearchService } from '../services/ImageSearchService';
import type { TriviaImage } from '../types';

const router = useRouter();
const gameStore = useGameStore();
const { isValidGame, validationErrors, totalImagesNeeded } = storeToRefs(gameStore);

const emit = defineEmits(['complete']);

// Config State
const apiKey = ref(import.meta.env.VITE_GOOGLE_API_KEY || '');
const searchEngineId = ref(import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID || '');
const isConfigured = ref(false);

// Search State
const nameList = ref(''); // Textarea input
const searchResults = ref<{ name: string; images: string[]; selected: string | null; fromCache?: boolean }[]>([]);
const isSearching = ref(false);
const cachedNames = ref<string[]>([]);

// Computed for validation display
const selectedCount = computed(() => searchResults.value.filter(r => r.selected).length);
const progressPercent = computed(() => Math.min(100, (selectedCount.value / totalImagesNeeded.value) * 100));

function loadCachedNames() {
  const names: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('trivia_img_')) {
      const name = key.replace('trivia_img_', '');
      names.push(name.charAt(0).toUpperCase() + name.slice(1));
    }
  }
  cachedNames.value = names.sort();
}

function addCachedName(name: string) {
  const currentNames = nameList.value.split(',').map(n => n.trim().toLowerCase());
  if (currentNames.includes(name.toLowerCase())) {
    return;
  }

  const current = nameList.value.trim();
  if (current.length > 0 && !current.endsWith(',')) {
    nameList.value += ', ' + name;
  } else {
    nameList.value += name;
  }
}

// Load on mount
loadCachedNames();

// Service
let searchService: ImageSearchService | null = null;

function configureApi() {
  if (apiKey.value && searchEngineId.value) {
    searchService = new ImageSearchService({
      apiKey: apiKey.value,
      searchEngineId: searchEngineId.value,
    });
    isConfigured.value = true;
  }
}

function restoreState() {
  if (gameStore.state.images.length > 0) {
    const existingNames: string[] = [];
    
    gameStore.state.images.forEach(img => {
      existingNames.push(img.name);
      
      // Check if we already have this in searchResults (dedupe)
      if (searchResults.value.some(r => r.name === img.name)) return;

      const cacheKey = `trivia_img_${img.name.toLowerCase()}`;
      const cached = localStorage.getItem(cacheKey);
      
      let images: string[] = [img.url];
      let fromCache = false;

      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            images = parsed;
            fromCache = true;
          }
        } catch (e) { /* ignore */ }
      }

      searchResults.value.push({
        name: img.name,
        images: images,
        selected: img.url,
        fromCache: fromCache
      });
    });

    // Populate nameList text area
    nameList.value = existingNames.join(', ');
  }
}

// Auto-configure if keys are present
if (apiKey.value && searchEngineId.value) {
  configureApi();
}

// Restore state if returning to this view
restoreState();

async function startBatchSearch() {
  if (!searchService) return;
  
  const names = nameList.value.split(',').map(n => n.trim()).filter(n => n.length > 0);
  if (names.length === 0) return;

  isSearching.value = true;
  
  // Don't clear existing results, append new ones if not present
  // Actually, user might want to start fresh or append. Let's append for now but avoid dupes.
  
  for (const name of names) {
    if (searchResults.value.some(r => r.name.toLowerCase() === name.toLowerCase())) continue;

    // Add a placeholder while searching
    const resultItem = { name, images: [], selected: null, fromCache: false };
    searchResults.value.push(resultItem);

    // Check Cache
    const cacheKey = `trivia_img_${name.toLowerCase()}`;
    const cached = localStorage.getItem(cacheKey);

    let images: string[] = [];

    if (cached) {
      try {
        images = JSON.parse(cached);
        resultItem.fromCache = true;
      } catch (e) {
        console.error('Cache parse error', e);
      }
    }

    // If no cache, search
    if (images.length === 0) {
      images = await searchService.searchImages(name);
      if (images.length > 0) {
        localStorage.setItem(cacheKey, JSON.stringify(images));
      }
      // Small delay only if we actually searched
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Update result
    const index = searchResults.value.findIndex(r => r.name === name);
    if (index !== -1 && searchResults.value[index]) {
      searchResults.value[index].images = images;
      searchResults.value[index].fromCache = resultItem.fromCache;
      const firstImage = images[0];
      if (firstImage) {
        searchResults.value[index].selected = firstImage; // Default to first
      }
    }
    
    // Update store with current selection so validation works reactively
    updateStoreImages();
  }

  isSearching.value = false;
  nameList.value = ''; // Clear input after search
}

async function refreshSearch(item: typeof searchResults.value[0]) {
  if (!searchService) return;
  
  item.fromCache = false;
  item.images = []; // Clear current
  
  const images = await searchService.searchImages(item.name);
  if (images.length > 0) {
    localStorage.setItem(`trivia_img_${item.name.toLowerCase()}`, JSON.stringify(images));
    item.images = images;
    item.selected = images[0] || null;
    updateStoreImages();
  }
}

function selectImage(name: string, url: string) {
  const item = searchResults.value.find(r => r.name === name);
  if (item) {
    item.selected = url;
    updateStoreImages();
  }
}

function updateStoreImages() {
  const selectedImages: TriviaImage[] = searchResults.value
    .filter(r => r.selected)
    .map((r, index) => ({
      id: `img-${index}-${Date.now()}`,
      name: r.name,
      url: r.selected!,
      source: 'web',
    }));
  
  gameStore.setImages(selectedImages);
}

function onNext() {
  if (isValidGame.value) {
    router.push('/assign');
  }
}

function onFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    Array.from(input.files).forEach(file => {
      const url = URL.createObjectURL(file);
      const name = file.name.split('.')[0] || 'unknown';
      
      const newItem: { name: string; images: string[]; selected: string | null; fromCache?: boolean } = {
        name: name,
        images: [url],
        selected: url,
        fromCache: false
      };
      searchResults.value.push(newItem);
    });
    updateStoreImages();
  }
}

function removeResult(name: string) {
    const index = searchResults.value.findIndex(r => r.name === name);
    if (index !== -1) {
        searchResults.value.splice(index, 1);
        updateStoreImages();
    }
}
</script>

<template>
  <div class="image-curator">
    <h2>Image Curator</h2>

    <!-- API Config Step -->
    <div v-if="!isConfigured" class="config-section">
      <p>Please enter your Google Custom Search details.</p>
      <div class="form-group">
        <label>API Key:</label>
        <input v-model="apiKey" type="password" placeholder="AIza..." />
      </div>
      <div class="form-group">
        <label>Search Engine ID:</label>
        <input v-model="searchEngineId" placeholder="0123..." />
      </div>
      <button @click="configureApi" :disabled="!apiKey || !searchEngineId">Start Session</button>
      <p class="hint">Keys are not saved permanently for security.</p>
      
      <div class="divider">OR</div>
      
      <div class="local-section">
        <h3>Use Local Files Only</h3>
        <p>Skip Google Search and just upload files.</p>
        <button @click="isConfigured = true">Skip to Upload</button>
      </div>
    </div>

    <!-- Search & Select Step -->
    <div v-else class="curator-section">
      
      <!-- Validation Status -->
      <div class="status-bar" :class="{ valid: isValidGame, invalid: !isValidGame }">
        <div class="status-info">
          <span>Selected: {{ selectedCount }} / {{ totalImagesNeeded }}</span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
        </div>
        <div v-if="validationErrors.length > 0" class="errors">
          <span v-for="err in validationErrors" :key="err" class="error-msg">{{ err }}</span>
        </div>
        <button @click="onNext" :disabled="!isValidGame" class="next-btn">
          Next: Assign Rounds
        </button>
      </div>

      <div class="input-area">
        <label>Enter Names (comma separated):</label>
        <textarea 
          v-model="nameList" 
          rows="4" 
          placeholder="Batman, Superman, Wonder Woman..."
        ></textarea>
        
        <div v-if="cachedNames.length > 0" class="cached-suggestions">
          <p class="suggestion-label">Previously Found:</p>
          <div class="chips">
            <button 
              v-for="name in cachedNames" 
              :key="name" 
              @click="addCachedName(name)"
              class="chip"
            >
              + {{ name }}
            </button>
          </div>
        </div>

        <button @click="startBatchSearch" :disabled="isSearching || !nameList">
          {{ isSearching ? 'Searching...' : 'Find Images' }}
        </button>
      </div>
      
      <div class="upload-area">
        <label>Or Upload Local Files:</label>
        <input type="file" multiple accept="image/*" @change="onFileSelect" />
      </div>

      <div class="results-area" v-if="searchResults.length > 0">
        <div v-for="item in searchResults" :key="item.name" class="result-item">
          <div class="result-header">
            <h3>{{ item.name }}</h3>
            <span v-if="item.fromCache" class="badge cached">Cached</span>
            <button v-if="item.fromCache" @click="refreshSearch(item)" class="refresh-btn" title="Search New">↻</button>
            <button @click="removeResult(item.name)" class="remove-btn" title="Remove">×</button>
          </div>
          <div v-if="item.images.length > 0" class="image-grid">
            <div 
              v-for="img in item.images" 
              :key="img" 
              class="image-option"
              :class="{ selected: item.selected === img }"
              @click="selectImage(item.name, img)"
            >
              <img :src="img" loading="lazy" />
            </div>
          </div>
          <div v-else class="no-results">
            No images found or searching...
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-curator {
  max-width: 800px;
  margin: 0 auto;
  text-align: left;
  padding-bottom: 100px; /* Space for fixed status bar if we wanted it fixed, but here it's top */
}

.config-section, .curator-section {
  background: #333;
  padding: 2rem;
  border-radius: 8px;
}

.status-bar {
  background: #222;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  border: 2px solid #444;
}

.status-bar.valid {
  border-color: #4CAF50;
}

.status-bar.invalid {
  border-color: #ff9800;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.progress-bar {
  flex: 1;
  height: 10px;
  background: #444;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4CAF50;
  transition: width 0.3s ease;
}

.errors {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.error-msg {
  color: #ff9800;
  font-size: 0.9rem;
}

.next-btn {
  width: 100%;
  background: #4CAF50;
  font-size: 1.1rem;
  font-weight: bold;
}

.form-group {
  margin-bottom: 1rem;
}

input, textarea {
  width: 100%;
  padding: 0.5rem;
  background: #222;
  border: 1px solid #555;
  color: white;
  margin-top: 0.5rem;
}

.image-grid {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.image-option {
  flex: 0 0 150px;
  height: 150px;
  cursor: pointer;
  border: 3px solid transparent;
  border-radius: 4px;
  overflow: hidden;
}

.image-option.selected {
  border-color: var(--color-primary);
}

.image-option img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

button {
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.badge.cached {
  background: #FF9800;
  color: black;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

.refresh-btn, .remove-btn {
  padding: 2px 8px;
  background: #444;
  font-size: 1rem;
}

.remove-btn {
    background: #ff4444;
    margin-left: auto;
}

.cached-suggestions {
  margin: 1rem 0;
  text-align: left;
}

.suggestion-label {
  font-size: 0.9rem;
  color: #aaa;
  margin-bottom: 0.5rem;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  background: #444;
  border: 1px solid #555;
  border-radius: 16px;
  padding: 4px 12px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
}

.chip:hover {
  background: #555;
}
</style>
