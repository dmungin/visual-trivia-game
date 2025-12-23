# Family Trivia - Visual Trivia Game

A customizable, visual trivia game application built with Vue 3 and TypeScript. Perfect for family gatherings, parties, and events.

## Features

-   **Visual Questions**: rounds consist of images (e.g., "Name this famous person").
-   **Flexible Game Setup**:
    -   Configure number of rounds (1-20).
    -   Set pictures per round (1-9).
    -   Adjust time per round (in minutes).
    -   Choose themes (Dark Mode, Christmas Theme).
-   **Image Curator**:
    -   Integrated Google Custom Search to find images by name.
    -   Local file upload support.
    -   Cache management: "Previously Found" suggestions for quick Game creation.
    -   Batch search: Enter a list of names and find images automatically.
-   **Round Assignment**:
    -   Drag-and-drop interface to organize images into rounds.
    -   Auto-fill functionality.
    -   Save and Load game configurations.
-   **Game Board**:
    -   Full-screen immersive display (98vw width usage).
    -   Built-in countdown timer with visual alerts.
    -   "Show Answers" toggle for the host.
    -   Overlay states for "Ready" and "Time's Up".
-   **Results & Answer Key**:
    -   Game summary screen with all images and names.
    -   Printable answer key view for the gamemaster.

### Images

Game Creation
<img width="632" height="892" alt="Image" src="https://github.com/user-attachments/assets/35fba05c-ce02-419e-9bf2-21a9e27ad494" />

Image Curator
<img width="1683" height="802" alt="Image" src="https://github.com/user-attachments/assets/2d954dcb-a79f-4578-849d-413ef212c770" />


<img width="1660" height="897" alt="Image" src="https://github.com/user-attachments/assets/ed9489db-018a-4726-bd1e-2a64b5a964a6" />

Round Assignment
<img width="1859" height="882" alt="Image" src="https://github.com/user-attachments/assets/b58e9cd2-a11d-41f6-9fc0-8f2428bf4464" />

Game Board
<img width="1876" height="784" alt="Image" src="https://github.com/user-attachments/assets/fa0bfbe7-4d5d-4193-a776-945fa78f2d40" />

Answer Board
<img width="1857" height="898" alt="Image" src="https://github.com/user-attachments/assets/1c30e18b-f3ce-4e7f-9254-1f506f943cab" />

Printable Answer Key
<img width="1850" height="824" alt="Image" src="https://github.com/user-attachments/assets/35912f4f-7868-4c4e-98d6-cea65285b7b3" />

## Tech Stack

-   **Vue 3** (Composition API, `<script setup>`)
-   **TypeScript** for type safety.
-   **Vite** for fast development and building.
-   **Pinia** for state management (Game settings, current session, persistence).
-   **Vue Router** for application navigation.
-   **CSS Variables** for easy theming.

## Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/dmungin/visual-trivia-game.git
    cd visual-trivia-game
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

## Configuration

To use the Google Image Search feature, you need to set up a Google Custom Search Engine (CSE).

1.  Create a Project in the [Google Cloud Console](https://console.cloud.google.com/).
2.  Enable the **Custom Search API**.
3.  Create an API Key.
4.  Set up a Search Engine ID at [cse.google.com](https://cse.google.com/cse/).
    -   Ensure "Image search" is enabled.
    -   Select "Search the entire web".

5.  **Environment Variables**:
    Create a `.env` file in the root directory (copy from `example.env` if available) and add:

    ```env
    VITE_GOOGLE_API_KEY=your_api_key_here
    VITE_GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
    ```

    *Note: You can also enter these keys directly in the app UI ("Image Curator" screen), but `env` setup is recommended for repeated use.*

## Usage

### Development
Run the local development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Building for Production
Build the optimized static files:
```bash
npm run build
```
The output will be in the `dist/` directory, ready to serve.

## How to Play

1.  **Setup**: Enter the number of rounds, images per round, and timer duration. Select a theme.
2.  **Curate**:
    -   Enter names of people/items you want to include (comma-separated).
    -   Click "Find Images" to fetch results.
    -   Select the best image for each person.
    -   Or, click "Previously Found" items to reuse cached images.
3.  **Assign**:
    -   Drag and drop the selected images into specific rounds.
    -   Save your game configuration for later if desired.
4.  **Play**:
    -   Start the game!
    -   The timer counts down.
    -   When round is over, the host can reveal answers on screen or check the printed key.
    -   Proceed to the next round until finished.

## Contributing

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## License

Distributed under the MIT License. See `LICENSE` for more information.
