export interface GameConfig {
    name?: string; // For saved configurations
    rounds: number;
    picturesPerRound: number;
    timePerRound: number; // in seconds
    theme: 'default' | 'christmas';
}

export interface TriviaImage {
    id: string;
    url: string;
    name: string; // The correct answer
    category?: string;
    source: 'local' | 'web';
}

export interface GameState {
    currentRound: number;
    score: number;
    isPlaying: boolean;
    images: TriviaImage[];
    roundStatus: 'ready' | 'active' | 'paused' | 'complete';
}

export interface SavedGame {
    name: string;
    config: GameConfig;
    images: TriviaImage[];
    assignedRounds: TriviaImage[][];
    createdAt: number;
}
