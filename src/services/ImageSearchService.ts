import axios from 'axios';

const GOOGLE_API_URL = 'https://www.googleapis.com/customsearch/v1';

export interface GoogleSearchConfig {
    apiKey: string;
    searchEngineId: string;
}

export class ImageSearchService {
    private config: GoogleSearchConfig;

    constructor(config: GoogleSearchConfig) {
        this.config = config;
    }

    async searchImages(query: string): Promise<string[]> {
        if (!this.config.apiKey || !this.config.searchEngineId) {
            console.warn('Google API Key or Search Engine ID is missing');
            return [];
        }

        try {
            const response = await axios.get(GOOGLE_API_URL, {
                params: {
                    key: this.config.apiKey,
                    cx: this.config.searchEngineId,
                    q: query,
                    searchType: 'image',
                    num: 10, // Fetch 10 results
                    safe: 'active', // Safe search
                },
            });

            if (response.data.items) {
                return response.data.items.map((item: any) => item.link);
            }
            return [];
        } catch (error) {
            console.error('Error searching images:', error);
            return [];
        }
    }
}
