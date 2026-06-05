# AI Sudoku Solver & Visualizer

A premium, interactive web-based Sudoku application that generates unique playable Sudoku puzzles and visualizes AI search algorithms solving them in real-time. Built entirely with vanilla HTML, CSS, and JavaScript.

---

## 🚀 Live Demo & Visuals

The application features a modern glassmorphic dashboard design with glow effects, custom sliders, keyboard navigation, and an interactive virtual numpad.

- **Dynamic Generation:** Puzzles are guaranteed to have a single unique solution.
- **Real-Time Visualizer:** Watch standard backtracking or Constraint Satisfaction (MRV) algorithms solve the board step-by-step.

---

## 🧠 AI Lab Insights & Algorithms

This project highlights Sudoku as a **Constraint Satisfaction Problem (CSP)** and compares two search strategies:

### 1. Standard Backtracking (Depth-First Search)
- Scans cells in a sequential row-by-row, column-by-column order.
- Tries values from $1$ to $9$ sequentially.
- Demonstrates a classic, unoptimized DFS strategy. Can take significant time on hard or expert puzzles due to excessive backtracking in suboptimal search branches.

### 2. Minimum Remaining Values (MRV) Heuristic
- Models cells as CSP variables.
- Rather than scanning sequentially, it prioritizes the cell with the **fewest possible valid candidate values** (minimum domain size).
- **Why it's better:** By picking the most constrained cell first, it detects dead-ends (failures) much earlier in the search tree, pruning invalid branches and reducing search steps by up to $100\times$.

---

## ⚡ Features

- **Puzzle Generator:** Generates playable grids on four difficulty levels:
  - **Easy:** 45 clues
  - **Medium:** 35 clues
  - **Hard:** 28 clues
  - **Expert:** 20 clues
  - Ensures a **unique solution** by validating each generated grid using a solution-counting algorithm before final presentation.
- **Visualizer Controls:**
  - **Algorithm Selector:** Swap between standard backtracking and MRV heuristic.
  - **Visualization Delay:** Speed up to instant (0ms) or slow down to 500ms to analyze the backtracking steps visually.
  - **Interactive State Manager:** Pause, resume, or stop the solver at any time.
- **Interactive UI/UX:**
  - Highlighting for row, column, 3x3 box, and matching numbers.
  - Custom visual cues for correct cells, user inputs, and cell conflicts (invalid rules).
  - Soundless visual animations upon solving the puzzle.
- **Controls & Shortcuts:**
  - **Mouse:** Click to select cells, use the virtual numpad to input numbers or clear cells.
  - **Keyboard:** Use Arrow keys to navigate the board, keys `1-9` to enter digits, and `Backspace` / `Delete` to clear.

---

## 📁 File Structure

```text
├── index.html       # Application layout and UI markup
├── style.css        # Premium styling sheet (Glassmorphism & animations)
├── app.js           # Event listeners, page controller, and UI state managers
├── generator.js     # Sudoku grid generation & clue removal with unique solution validation
└── solver.js        # Core backtracking solver featuring the MRV CSP heuristic
```

---

## 🛠️ How to Run Locally

Since this is a client-side vanilla JavaScript application, no installation or compilation is needed.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sadmaaansakib/Sudoku.git
   cd Sudoku
   ```
2. **Open in Browser:**
   - Double-click `index.html` to open it in your default web browser.
   - Alternatively, serve it locally using a simple HTTP server (e.g., Live Server extension in VS Code, or python's built-in server):
     ```bash
     python -m http.server 8000
     ```
     Then navigate to `http://localhost:8000`.

---

## 📝 Configuration details

- **Variables:** Cells in the $9 \times 9$ grid.
- **Domains:** $\{1, 2, 3, 4, 5, 6, 7, 8, 9\}$.
- **Constraints:** Alldifferent constraints over rows, columns, and 3x3 sub-grids.
