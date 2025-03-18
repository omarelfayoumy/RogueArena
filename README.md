# Rogue AI Arena

Rogue AI Arena is a real-time, AI-powered roguelike arena game where players battle adaptive enemies. Use upgrade systems, ultimate abilities, dev mode adjustments, and a full-screen background to enhance your gaming experience.

## Project Structure

```
/rogueArena
├── frontend/          # Contains the React and Phaser.js game UI
│   ├── public/        # Public folder for static assets and index.html
│   │   └── assets/    # Contains images: player_spaceship.png, enemy_spaceship.png, background.jpg, etc.
│   ├── src/           # Source code (e.g., Game.js, App.js)
│   └── package.json   # Frontend dependencies and scripts
├── backend/           # FastAPI backend for enemy AI and Firebase integration
│   ├── ai/            # AI logic modules (enemy AI, level generation)
│   ├── api.py         # FastAPI endpoints
│   ├── firebase.py    # Firebase integration
│   └── requirements.txt # Python dependencies
└── README.md          # Project documentation
```

## Technologies Used

- **Phaser.js**: Game engine for real-time gameplay.
- **React**: For UI components and game interface.
- **FastAPI**: Backend API for enemy AI and other server logic.
- **Firebase**: Database for storing player stats and AI data.
- **OpenAI GPT-4-turbo**: For enemy AI decision-making.
- **GitHub Pages**: For deploying the frontend.
- **Railway.app**: For deploying the backend.

## Features

- **Full-Screen Gameplay**: The game launches full screen without borders.
- **Dynamic Background**: A custom background image (`background.jpg`) is used to cover the entire screen.
- **Adaptive Enemies**: Enemies change color based on their health (white, light red, medium red, dark red, very dark red).
- **Upgrade System**: Every 5 levels, players can select an upgrade (damage, speed, or projectile count).
- **Ultimate Ability**: Build up your ultimate meter by defeating enemies and press **X** when ready for a temporary boost.
- **Dev Mode**: Toggle dev mode (**D**) to adjust player speed (**U/J**), damage (**I/K**), and projectile count (**O/L**) for testing.
- **Pause & Restart**: Press **P** to pause/resume and **R** to restart the game after a game over.

## Setup and Running Instructions

### Prerequisites

- **Node.js** (for the frontend)
- **Python 3.8+** (for the backend)
- **Git**

### Frontend Setup

1. **Navigate to the Frontend Folder:**
   ```bash
   cd frontend
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Run the Development Server:**
   ```bash
   npm start
   ```
   This should automatically open the game in your default web browser.

### Backend Setup

1. **Navigate to the Backend Folder:**
   ```bash
   cd backend
   ```
2. **Create and Activate a Virtual Environment:**
   ```bash
   python -m venv venv
   # On macOS/Linux:
   source venv/bin/activate
   # On Windows:
   venv\Scripts\activate
   ```
3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Run the FastAPI Server:**
   ```bash
   uvicorn api:app --reload
   ```
   The backend server should now be running at `http://127.0.0.1:8000`.

## Deployment

- **Frontend**: Deploy the frontend folder (built with `npm run build`) to GitHub Pages or another static hosting service.
- **Backend**: Deploy the backend folder to Railway.app or another hosting platform that supports FastAPI.

## Game Controls

- **Movement**: Arrow keys
- **Shoot**: SPACE
- **Ultimate Ability**: X (when the ultimate is ready)
- **Upgrade Selection**: 1, 2, or 3 (when prompted)
- **Dev Mode**: Toggle with **D**; adjust stats with:
  - **U/J** for speed
  - **I/K** for damage
  - **O/L** for projectile count
- **Pause**: P
- **Restart (After Game Over)**: R

## Asset Instructions

Ensure that the following image files are placed in the `frontend/public/assets` folder:

- `player_spaceship.png`
- `enemy_spaceship.png`
- `background.jpg`

## Additional Notes

- The game automatically starts in full-screen mode and removes any default browser margins. If you notice a border, check your HTML/CSS settings.
- The backend uses FastAPI to power enemy AI; ensure you configure any necessary API keys.
- **Dev Mode** is intended for testing and can be toggled on/off to adjust in-game parameters.

**Happy Gaming!** 🎮
