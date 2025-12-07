# Battleship Quiz Game - Implementation Plan

## Overview
Creating an interactive "Battleship" quiz game for two teams with multimedia questions, score tracking, and game state persistence.

## Technology Stack Decision

### Chosen Stack: Vite + React + TypeScript + Tailwind CSS + Zustand
**Rationale:**
- **Vite**: Lightning-fast dev server and optimized production builds
- **React**: Modern UI with component-based architecture
- **TypeScript**: Type safety for complex game state management
- **Tailwind CSS**: Modern, beautiful styling with minimal effort
- **Zustand**: Lightweight state management (3KB) with localStorage persistence
- **localStorage**: For game state persistence (survives page refresh)
- **JSON files**: For question data and ship configuration loaded at runtime

**Why NOT Electron:**
- Electron bundles 150MB Chromium runtime - massive overkill for a simple quiz game
- Deployment overhead: users must install a large app vs. double-clicking HTML
- "Easy to deploy locally" means sharing a `dist/` folder, not installing Electron
- Resource waste: running full Chromium for a local game is excessive

**Result:** Simple web app that builds to `dist/index.html` - double-click to run in any browser!

## Project Structure

```
battleship/
├── public/
│   ├── data/
│   │   ├── questions.json     # Question database
│   │   ├── ships.json         # Ship coordinates
│   │   └── bombs.json         # Bomb coordinates
│   ├── media/
│   │   ├── audio/             # Question audio files
│   │   └── video/             # Question video files
│   └── sounds/
│       ├── hit.mp3
│       ├── miss.mp3
│       ├── correct.mp3
│       └── wrong.mp3
├── src/
│   ├── components/
│   │   ├── WelcomeScreen.tsx  # Team name entry
│   │   ├── GameBoard.tsx      # Main 10x10 grid
│   │   ├── Cell.tsx           # Individual grid cell
│   │   ├── QuestionModal.tsx  # Question display popup
│   │   ├── MediaPlayer.tsx    # Audio/video player
│   │   ├── ScoreBoard.tsx     # Team scores display
│   │   └── GameControls.tsx   # Host controls
│   ├── hooks/
│   │   ├── useGameState.ts    # Zustand store
│   │   ├── useLocalStorage.ts # Persistence hook
│   │   └── useSound.ts        # Sound effects
│   ├── types/
│   │   ├── game.ts            # Game types
│   │   ├── question.ts        # Question types
│   │   └── cell.ts            # Cell types
│   ├── utils/
│   │   ├── gameLogic.ts       # Game rules
│   │   ├── storage.ts         # localStorage helpers
│   │   └── loadData.ts        # JSON data loading
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

## Data Models

### questions.json
```json
{
  "questions": [
    {
      "id": "q1",
      "category": "История",
      "type": "text",
      "difficulty": "easy",
      "points": 100,
      "question": "Вопрос текстом?",
      "answer": "Правильный ответ",
      "mediaPath": null
    },
    {
      "id": "q2",
      "category": "Музыка",
      "type": "audio",
      "difficulty": "medium",
      "points": 200,
      "question": "Угадайте мелодию",
      "answer": "Название песни",
      "mediaPath": "audio/song1.mp3"
    },
    {
      "id": "q15",
      "category": "Бомба",
      "type": "creative",
      "difficulty": "hard",
      "points": 500,
      "question": "Творческое задание...",
      "answer": "Критерии оценки..."
    }
  ]
}
```

### ships.json
```json
{
  "ships": [
    {
      "id": "ship1",
      "cells": ["А1", "А2", "А3", "А4"],
      "questionIds": ["q1", "q2", "q3", "q4"]
    }
  ]
}
```

### bombs.json
```json
{
  "bombs": ["Г5", "И9"],
  "questionIds": ["q15", "q16"]
}
```

### Game State (localStorage via Zustand)
```typescript
{
  team1: { name: string, score: number },
  team2: { name: string, score: number },
  currentTurn: 1 | 2,
  clickedCells: string[],      // ["А1", "Б3", ...]
  revealedShips: string[],
  gameStarted: boolean,
  timestamp: number
}
```

## Implementation Plan - Detailed Steps

### Phase 1: Project Setup & Foundation
1. **Initialize Vite + React + TypeScript project**
   ```bash
   npm create vite@latest battleship -- --template react-ts
   cd battleship
   npm install
   ```

2. **Install dependencies**
   ```bash
   npm install zustand tailwindcss postcss autoprefixer
   npm install -D @types/node
   npx tailwindcss init -p
   ```

3. **Configure Tailwind CSS**
   - Update tailwind.config.js with content paths
   - Add Tailwind directives to index.css

4. **Create directory structure**
   - Create `public/data/`, `public/media/audio/`, `public/media/video/`, `public/sounds/`
   - Create `src/components/`, `src/hooks/`, `src/types/`, `src/utils/`

5. **Generate sample data files**
   - Create `public/data/questions.json` with 30+ sample questions (various types)
   - Create `public/data/ships.json` with battleship layout (4-cell, 3-cell, 2-cell ships)
   - Create `public/data/bombs.json` with 3-5 bomb locations
   - Add placeholder sound files to `public/sounds/`

### Phase 2: Core Types & State Management
6. **Define TypeScript types** (src/types/)
   - `game.ts`: Team, GameState, CellState
   - `question.ts`: Question, QuestionType (text/audio/video/creative)
   - `cell.ts`: CellType (empty/ship/bomb), CellStatus

7. **Create Zustand store** (src/hooks/useGameState.ts)
   - State: teams, scores, currentTurn, clickedCells, gameStarted
   - Actions: startGame, clickCell, answerQuestion, switchTurn, resetGame
   - Middleware: persist to localStorage

8. **Implement utility functions** (src/utils/)
   - `loadData.ts`: Load questions/ships/bombs from JSON files
   - `gameLogic.ts`: getCellType(), isHit(), isMiss(), isBomb()
   - `storage.ts`: Helper functions for localStorage

### Phase 3: Core UI Components
9. **WelcomeScreen.tsx**
   - Team name inputs (styled with Tailwind)
   - "Начать игру" button
   - "Продолжить игру" button (if saved state exists)
   - Beautiful gradient background

10. **GameBoard.tsx**
    - 10x10 grid layout using CSS Grid
    - Row labels: 1-10 (vertical)
    - Column labels: А, Б, В, Г, Д, Е, Ж, З, И, К (horizontal, Russian)
    - Render Cell components for each grid position
    - Pass click handlers to cells

11. **Cell.tsx**
    - Props: coordinate, status (untouched/miss/hit/bomb)
    - Visual states with different colors/icons
    - Hover effects
    - Click handler
    - CSS transitions for animations

12. **ScoreBoard.tsx**
    - Display both team names
    - Show current scores (large, readable)
    - Highlight which team's turn it is
    - Position at top of screen

### Phase 4: Question System
13. **QuestionModal.tsx**
    - Props: question, onCorrect, onWrong, onClose
    - Display question text and category
    - Show points value
    - Conditionally render MediaPlayer for audio/video
    - Host control buttons: ✓ Правильно (green) / ✗ Неправильно (red)
    - Show answer after host clicks button
    - Modal overlay with backdrop

14. **MediaPlayer.tsx**
    - Audio player: `<audio>` with custom controls
    - Video player: `<video>` with controls
    - Play/pause button
    - Progress bar
    - Props: mediaType, mediaPath

15. **useSound.ts hook**
    - Load sound effects (hit.mp3, miss.mp3, correct.mp3, wrong.mp3)
    - Expose playHit(), playMiss(), playCorrect(), playWrong()

### Phase 5: Game Logic Integration
16. **App.tsx - Main controller**
    - Route between WelcomeScreen and GameBoard based on gameStarted state
    - Load questions/ships/bombs data on mount
    - Pass data and callbacks to child components

17. **Implement complete game flow**
    - Cell click → check cell type (ship/bomb/empty)
    - If empty: play miss sound, mark as miss, switch turn
    - If ship/bomb: play hit sound, open QuestionModal
    - Host judges answer → update score if correct → give extra turn
    - Host judges wrong → close modal, switch turn
    - Auto-save state after every action
    - Check for game end condition

### Phase 6: Polish & UI/UX
18. **Styling with Tailwind**
    - Modern color scheme (dark theme or vibrant gradients)
    - Large, readable fonts for presentation
    - Smooth animations for cell clicks
    - Beautiful modal design
    - Responsive layout (optimized for fullscreen)

19. **Animations**
    - Cell click: scale + color change
    - Miss: X mark fade-in
    - Hit: checkmark or ship icon fade-in
    - Score update: number animation
    - Modal enter/exit transitions

20. **Sound effects**
    - Integrate useSound hook
    - Play appropriate sounds on each action
    - Ensure sounds don't overlap

### Phase 7: Testing & Deployment
21. **Testing**
    - Test all cell types (empty, ship, bomb)
    - Test all question types (text, audio, video, creative)
    - Test score calculation
    - Test turn switching logic
    - Test localStorage persistence (refresh page)
    - Test edge cases (all cells clicked)

22. **Production build**
    ```bash
    npm run build
    ```
    - Output: `dist/` folder with index.html
    - Test that double-clicking index.html works

23. **Documentation**
    - Create README.md with:
      - Setup instructions
      - How to edit questions.json
      - How to add media files
      - How to run the game

## Critical Files to Create

### Configuration Files:
1. [package.json](package.json) - Dependencies: react, typescript, vite, zustand, tailwindcss
2. [vite.config.ts](vite.config.ts) - Vite build configuration
3. [tsconfig.json](tsconfig.json) - TypeScript compiler options
4. [tailwind.config.js](tailwind.config.js) - Tailwind CSS configuration
5. [postcss.config.js](postcss.config.js) - PostCSS for Tailwind

### Type Definitions:
6. [src/types/game.ts](src/types/game.ts) - Team, GameState, CellState types
7. [src/types/question.ts](src/types/question.ts) - Question, QuestionType types
8. [src/types/cell.ts](src/types/cell.ts) - CellType, CellStatus types

### State Management:
9. [src/hooks/useGameState.ts](src/hooks/useGameState.ts) - **CRITICAL** - Zustand store with all game logic
10. [src/hooks/useSound.ts](src/hooks/useSound.ts) - Sound effects hook

### Utilities:
11. [src/utils/loadData.ts](src/utils/loadData.ts) - Load JSON data files
12. [src/utils/gameLogic.ts](src/utils/gameLogic.ts) - Game rules and cell type checking
13. [src/utils/storage.ts](src/utils/storage.ts) - localStorage helpers

### Core Components:
14. [src/App.tsx](src/App.tsx) - **CRITICAL** - Main app controller
15. [src/components/WelcomeScreen.tsx](src/components/WelcomeScreen.tsx) - Team name entry screen
16. [src/components/GameBoard.tsx](src/components/GameBoard.tsx) - **CRITICAL** - 10x10 grid layout
17. [src/components/Cell.tsx](src/components/Cell.tsx) - Individual grid cell
18. [src/components/ScoreBoard.tsx](src/components/ScoreBoard.tsx) - Team scores display
19. [src/components/QuestionModal.tsx](src/components/QuestionModal.tsx) - **CRITICAL** - Question popup
20. [src/components/MediaPlayer.tsx](src/components/MediaPlayer.tsx) - Audio/video player

### Data Files:
21. [public/data/questions.json](public/data/questions.json) - **CRITICAL** - 30+ sample questions
22. [public/data/ships.json](public/data/ships.json) - Ship positions configuration
23. [public/data/bombs.json](public/data/bombs.json) - Bomb locations

### Styles:
24. [src/index.css](src/index.css) - Global styles with Tailwind directives

## Deployment Instructions

**For Host to Deploy:**
1. Download the project folder
2. Open terminal in project directory
3. Run: `npm install` (first time only)
4. Edit `public/data/questions.json` with your questions
5. Add media files to `public/media/audio/` and `public/media/video/`
6. Run: `npm run build`
7. Share the `dist/` folder
8. Double-click `dist/index.html` to play

**For Game Day:**
1. Open `dist/index.html` in browser
2. Press F11 for fullscreen
3. Enter team names
4. Play!

## Success Criteria
✅ Two teams can play against host
✅ 10x10 grid with Russian letters (А-К) and numbers (1-10)
✅ Three cell types: ships, empty, bombs
✅ Questions appear on hits with text/audio/video/creative types
✅ Host can mark answers correct/incorrect
✅ Correct answer gives extra turn, wrong answer switches turn
✅ Scores update automatically
✅ Game state persists across browser refresh
✅ Modern, beautiful UI with animations
✅ Easy to deploy: just double-click HTML file
✅ Media files stored and played locally
