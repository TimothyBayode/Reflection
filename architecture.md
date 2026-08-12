# 🪞 Reflection — Architecture

> Technical architecture for the Reflection web game MVP.

---

## 1. System Overview

```mermaid
flowchart TD
    INPUT["🎮 Input Layer<br/>Keyboard / Touch"] --> GAME["Game Core"]

    GAME --> PLAYER["Player System"]
    GAME --> WORLD["World Manager"]
    GAME --> LEVEL["Level Manager"]
    GAME --> UI["UI / HUD"]
    GAME --> AUDIO["Audio Manager"]
    GAME --> SAVE["Save Manager"]

    WORLD --> REALITY["Reality World"]
    WORLD --> REFLECTION["Reflection World"]

    REALITY --> PHYSICS["Physics / Collision"]
    REFLECTION --> PHYSICS

    LEVEL --> RULES["Rule Engine"]
    LEVEL --> HAZARDS["Hazard System"]
    LEVEL --> CHECKPOINT["Checkpoint System"]

    SAVE --> STORAGE["LocalStorage"]

    UI --> VIEWPORT["World Viewport System"]
    VIEWPORT --> REALITY
    VIEWPORT --> REFLECTION
