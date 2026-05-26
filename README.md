<div align="center">

# Tiko.az

### Classic Tic-Tac-Toe, modernised — with a genuinely smart AI opponent

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)]()
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)]()
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)]()
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

[**▶ Live Demo**](https://goshgarhasanov.github.io/tiko.az/)

</div>

---

## Overview

**Tiko.az** is a polished, modern take on classic Tic-Tac-Toe (X-O), built with **pure HTML, CSS and vanilla JavaScript** — no frameworks, no build step. It runs instantly in the browser and installs as a PWA.

## Features

- 🤖 **Real AI opponent** — minimax with alpha-beta pruning, so the hard mode is genuinely unbeatable.
- 🎚️ **4 difficulty levels** — from casual to perfect play.
- 🔲 **5 board sizes** — beyond the classic 3×3.
- 🎨 **3 visual skins** and a clean, responsive, mobile-first UI.
- 📊 **Statistics** — wins, losses and draws are tracked locally.
- 📱 **PWA** — installable and works offline (`manifest.webmanifest`).
- 🧪 Includes a small test suite.

## Tech Stack

Pure **HTML5 + CSS3 + vanilla JavaScript** (ES modules). Zero dependencies, zero build tooling.

## Run Locally

```bash
git clone https://github.com/goshgarhasanov/tiko.az.git
cd tiko.az
# open index.html directly, or serve it:
python3 -m http.server 8000   # → http://localhost:8000
```

## Project Structure

```
tiko.az/
├── index.html
├── styles/      # styling
├── scripts/     # game logic + AI (minimax / alpha-beta)
├── assets/
├── tests/
└── manifest.webmanifest
```

## License

[MIT](LICENSE) © Goshgar Hasanzadeh
