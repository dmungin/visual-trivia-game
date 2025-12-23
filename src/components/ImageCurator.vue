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
const selectedCached = ref<string[]>([]);

// Computed for validation display
const selectedCount = computed(() => searchResults.value.filter(r => r.selected).length);
const progressPercent = computed(() => Math.min(100, (selectedCount.value / totalImagesNeeded.value) * 100));

const selectAllCached = computed({
  get: () => cachedNames.value.length > 0 && selectedCached.value.length === cachedNames.value.length,
  set: (val: boolean) => {
    selectedCached.value = val ? [...cachedNames.value] : [];
  }
});

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

function addSelectedToSearch() {
  if (selectedCached.value.length === 0) return;
  const current = nameList.value ? nameList.value.split(',').map(n => n.trim()) : [];
  // Append only unique ones
  const newNames = selectedCached.value.filter(n => !current.some(c => c.toLowerCase() === n.toLowerCase()));
  
  if (newNames.length > 0) {
    if (nameList.value && !nameList.value.trim().endsWith(',')) {
      nameList.value += ', ';
    }
    nameList.value += newNames.join(', ');
  }
  
  // Clear selection after adding? Maybe keep it for reference?
  // Let's keep it.
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

function deleteCachedName(name: string) {
  const cacheKey = `trivia_img_${name.toLowerCase()}`;
  localStorage.removeItem(cacheKey);
  cachedNames.value = cachedNames.value.filter(n => n !== name);
}

function deleteImageFromCache(item: typeof searchResults.value[0], imageUrl: string) {
  // Remove from current view
  const index = item.images.indexOf(imageUrl);
  if (index !== -1) {
    item.images.splice(index, 1);
  }

  // Update selection if needed
  if (item.selected === imageUrl) {
    item.selected = item.images[0] || null;
  }
  
  // Update Store
  updateStoreImages();

  // Update Cache
  const cacheKey = `trivia_img_${item.name.toLowerCase()}`;
  if (item.images.length > 0) {
    localStorage.setItem(cacheKey, JSON.stringify(item.images));
  } else {
    // If no images left, maybe remove the key entirely? 
    // Or keep empty array? Let's remove key so it doesn't show as "Cached" with 0 items next time
    localStorage.removeItem(cacheKey);
    // Also remove from cachedNames if it was there
    cachedNames.value = cachedNames.value.filter(n => n.toLowerCase() !== item.name.toLowerCase());
  }
}
</script>

<template>
  <div class="image-curator">
    <div class="header-row">
      <h2>Image Curator</h2>
      <button v-if="isConfigured" @click="router.push('/')" class="back-btn">← Back to Setup</button>
    </div>

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
          <div class="cached-header">
            <p class="suggestion-label">Previously Found ({{ cachedNames.length }}):</p>
            <div class="select-all-wrapper">
               <input type="checkbox" id="selectAll" v-model="selectAllCached" />
               <label for="selectAll">Select All</label>
            </div>
          </div>
          
          <div class="chips checkbox-grid">
            <div 
              v-for="name in cachedNames" 
              :key="name" 
              class="chip-wrapper checkbox-chip"
              :class="{ active: selectedCached.includes(name) }"
            >
              <label class="check-label">
                <input type="checkbox" :value="name" v-model="selectedCached" />
                <span class="name-text">{{ name }}</span>
              </label>
              <button @click.stop="deleteCachedName(name)" class="chip-delete" title="Remove from cache">×</button>
            </div>
          </div>

          <button 
             v-if="selectedCached.length > 0"
             @click="addSelectedToSearch" 
             class="secondary-btn add-selected-btn"
          >
             Add {{ selectedCached.length }} Selected to Search
          </button>
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
              <button 
                class="img-delete-btn" 
                @click.stop="deleteImageFromCache(item, img)" 
                title="Delete Image"
              >×</button>
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
  max-width: 98vw;
  margin: 0 auto;
  text-align: left;
  padding-bottom: 100px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.back-btn {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.2);
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  color: var(--color-text-dim);
}

.back-btn:hover {
  background: rgba(255,255,255,0.1);
  color: white;
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

.cached-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.select-all-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #ccc;
  cursor: pointer;
}

.select-all-wrapper input {
 margin: 0;
 width: auto;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  max-height: 250px;
  overflow-y: auto;
  padding: 5px;
  background: rgba(0,0,0,0.2);
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.05);
}

.chip-wrapper.checkbox-chip {
  padding: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;
  flex-wrap: nowrap;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.chip-wrapper.checkbox-chip:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  border-color: rgba(255, 255, 255, 0.2);
}

.chip-wrapper.checkbox-chip.active {
  background: #2e7d32; /* darker green to indicate selection */
  border-color: #4CAF50;
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.4);
}

.check-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 6px 10px;
  cursor: pointer;
  flex: 1;
  overflow: hidden;
}

.check-label input {
  margin: 0;
  width: auto;
}

.name-text {
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chip-add {
  display: none; /* No longer needed in checkbox mode */
}

.add-selected-btn {
  margin-top: 1rem;
  width: 100%;
  padding: 0.8rem;
  background: var(--color-secondary);
  color: black;
  font-weight: bold;
}

.add-selected-btn:hover {
  background: #03dac6; /* Slightly lighter secondary */
  transform: translateY(-2px);
}

.chip-delete {
  background: rgba(0,0,0,0.2);
  border: none;
  padding: 4px 8px;
  color: #aaa;
  font-size: 1rem;
  cursor: pointer;
  border-left: 1px solid #555;
}

.chip-delete:hover {
  background: #ff4444;
  color: white;
}

.image-option {
  position: relative;
}

.img-delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0,0,0,0.6);
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.2s;
  border: 1px solid rgba(255,255,255,0.3);
}

.img-delete-btn:hover {
  background: #ff4444;
  border-color: #ff4444;
}

.image-option:hover .img-delete-btn {
  opacity: 1;
}
</style>
