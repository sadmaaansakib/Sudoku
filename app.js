document.addEventListener('DOMContentLoaded', () => {
    // Game Instances
    const solver = new SudokuSolver();
    const generator = new SudokuGenerator();

    // DOM Elements
    const boardElement = document.getElementById('sudoku-board');
    const difficultySelect = document.getElementById('difficulty-select');
    const diffBadge = document.getElementById('diff-badge');
    const timerElement = document.getElementById('timer');
    const newGameBtn = document.getElementById('new-game-btn');
    const algoSelect = document.getElementById('algorithm-select');
    const algoHelpText = document.getElementById('algo-help-text');
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    const solveBtn = document.getElementById('solve-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const stopBtn = document.getElementById('stop-btn');
    const stepsCountElement = document.getElementById('steps-count');
    const solveStateElement = document.getElementById('solve-state');
    const numButtons = document.querySelectorAll('.num-btn');
    const victoryModal = document.getElementById('victory-modal');
    const victoryText = document.getElementById('victory-text');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // Game State Variables
    let initialBoard = []; // 0 means empty
    let currentBoard = [];
    let solvedBoard = [];
    let selectedCell = null; // { row, col }
    let timerInterval = null;
    let secondsElapsed = 0;
    let isSolving = false;

    // Help descriptions for algorithms
    const algoDescriptions = {
        mrv: "MRV (Minimum Remaining Values) solves grids up to 100x faster by choosing cells with the fewest legal moves first.",
        standard: "Standard Backtracking scans row-by-row, column-by-column. It demonstrates the classic DFS approach but can be slow on hard puzzles."
    };

    // Initialize Game
    function initGame() {
        // Stop any active solving
        stopSolvingProcess();

        const difficulty = difficultySelect.value;
        diffBadge.innerText = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
        
        // Generate new puzzle
        const result = generator.generate(difficulty);
        initialBoard = result.puzzle.map(row => [...row]);
        currentBoard = result.puzzle.map(row => [...row]);
        solvedBoard = result.solution.map(row => [...row]);

        selectedCell = null;
        stepsCountElement.innerText = '0';
        updateSolveState('idle');
        
        // Reset Timer
        resetTimer();
        startTimer();

        // Build Board DOM
        buildBoardDOM();
    }

    // Build grid cells
    function buildBoardDOM() {
        boardElement.innerHTML = '';
        boardElement.classList.remove('board-victory-anim');
        
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                
                const val = currentBoard[r][c];
                if (val !== 0) {
                    cell.innerText = val;
                    if (initialBoard[r][c] !== 0) {
                        cell.classList.add('clue');
                    } else {
                        cell.classList.add('user-input');
                    }
                }

                // Click handler
                cell.addEventListener('click', () => selectCell(r, c));
                
                boardElement.appendChild(cell);
            }
        }
    }

    // Update cell rendering based on state
    function updateBoardUI() {
        const cells = boardElement.children;
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const r = parseInt(cell.dataset.row);
            const c = parseInt(cell.dataset.col);
            const val = currentBoard[r][c];

            // Reset text and classes (preserving permanent ones like clue)
            cell.innerText = val !== 0 ? val : '';
            
            // Clean up temporary visual states
            cell.classList.remove('user-input', 'hl-rel', 'hl-match', 'active-cell', 'invalid-input');

            // Apply standard states
            if (initialBoard[r][c] !== 0) {
                cell.classList.add('clue');
            } else if (val !== 0) {
                cell.classList.add('user-input');
            }

            // Apply row/col/box highlights and matches
            if (selectedCell && !isSolving) {
                const isSameRow = r === selectedCell.row;
                const isSameCol = c === selectedCell.col;
                const isSameBox = Math.floor(r / 3) === Math.floor(selectedCell.row / 3) &&
                                  Math.floor(c / 3) === Math.floor(selectedCell.col / 3);
                
                if (r === selectedCell.row && c === selectedCell.col) {
                    cell.classList.add('active-cell');
                } else if (isSameRow || isSameCol || isSameBox) {
                    cell.classList.add('hl-rel');
                }

                // Value matching highlight
                const selectedVal = currentBoard[selectedCell.row][selectedCell.col];
                if (selectedVal !== 0 && val === selectedVal && (r !== selectedCell.row || c !== selectedCell.col)) {
                    cell.classList.add('hl-match');
                }
            }

            // Apply rule violations
            if (val !== 0 && initialBoard[r][c] === 0) {
                // Check if this user number is valid under current rules (ignoring itself)
                if (!solver.isValid(currentBoard, r, c, val)) {
                    cell.classList.add('invalid-input');
                }
            }
        }
    }

    // Select a cell
    function selectCell(row, col) {
        if (isSolving) return; // Disable selections while AI is solving
        
        selectedCell = { row, col };
        updateBoardUI();
    }

    // Handle number inputs
    function enterNumber(val) {
        if (!selectedCell || isSolving) return;
        const { row, col } = selectedCell;

        // Clues are locked
        if (initialBoard[row][col] !== 0) return;

        currentBoard[row][col] = val;
        updateBoardUI();

        // Check if finished
        checkWinState();
    }

    // Check if player solved the puzzle
    function checkWinState() {
        // Board is full
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (currentBoard[r][c] === 0) return false;
                // Verify no rule violations
                if (!solver.isValid(currentBoard, r, c, currentBoard[r][c])) return false;
            }
        }

        // Victory!
        stopTimer();
        boardElement.classList.add('board-victory-anim');
        victoryText.innerText = `Congratulations! You solved the puzzle in ${timerElement.innerText}.`;
        victoryModal.classList.add('active');
        return true;
    }

    // AI Step callback function
    async function onSolverStep(row, col, val, state, steps) {
        // Update model board
        currentBoard[row][col] = val;
        
        // Find DOM element
        const cellIndex = row * 9 + col;
        const cell = boardElement.children[cellIndex];
        
        // Update cell display
        cell.innerText = val !== 0 ? val : '';
        
        // Reset dynamic solver classes
        cell.classList.remove('ai-try', 'ai-backtrack', 'ai-success', 'user-input');

        if (state === 'try') {
            cell.classList.add('ai-try');
        } else if (state === 'backtrack') {
            cell.classList.add('ai-backtrack');
        } else if (state === 'success') {
            cell.classList.add('ai-success');
        }

        // Update stats
        stepsCountElement.innerText = steps;

        // Allow UI to refresh (even at 0ms delay, we yield to browser repaint sometimes)
        if (steps % 10 === 0 || solver.delay > 0) {
            await new Promise(resolve => requestAnimationFrame(resolve));
        }

        return solver.isSolving; // solver will stop if isSolving changes to false
    }

    // Stop solving process completely
    function stopSolvingProcess() {
        solver.stopSolving();
        isSolving = false;
        
        // Reset buttons
        solveBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start AI Solve';
        solveBtn.disabled = false;
        pauseBtn.disabled = true;
        pauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        stopBtn.disabled = true;
        
        updateSolveState('idle');
    }

    // Solve Board using AI
    async function startAISolve() {
        if (isSolving) return;

        // Reset board to initial clue board to start fresh
        currentBoard = initialBoard.map(row => [...row]);
        buildBoardDOM();
        
        isSolving = true;
        selectedCell = null;
        
        solveBtn.disabled = true;
        pauseBtn.disabled = false;
        stopBtn.disabled = false;
        
        updateSolveState('running');
        stopTimer();

        const method = algoSelect.value;
        const delay = parseInt(speedSlider.value);
        
        const solved = await solver.solve(currentBoard, method, onSolverStep, delay);

        isSolving = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        solveBtn.disabled = false;

        if (solved) {
            currentBoard = solved.map(row => [...row]);
            updateSolveState('complete');
            boardElement.classList.add('board-victory-anim');
            
            // Add success style to all user solved cells
            const cells = boardElement.children;
            for (let i = 0; i < cells.length; i++) {
                const cell = cells[i];
                const r = parseInt(cell.dataset.row);
                const c = parseInt(cell.dataset.col);
                if (initialBoard[r][c] === 0) {
                    cell.classList.remove('ai-try', 'ai-success');
                    cell.classList.add('user-input');
                }
            }

            // Show Victory Modal for AI solver completion
            victoryText.innerText = `The AI Solver completed the puzzle in ${stepsCountElement.innerText} assignments!`;
            victoryModal.classList.add('active');
        } else {
            // Stopped or unsolvable
            updateSolveState('idle');
            updateBoardUI();
        }
    }

    // Timer functions
    function startTimer() {
        timerInterval = setInterval(() => {
            secondsElapsed++;
            const mins = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
            const secs = (secondsElapsed % 60).toString().padStart(2, '0');
            timerElement.innerText = `${mins}:${secs}`;
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function resetTimer() {
        stopTimer();
        secondsElapsed = 0;
        timerElement.innerText = '00:00';
    }

    // Update visual label of AI Solve status
    function updateSolveState(state) {
        solveStateElement.className = 'stat-val';
        if (state === 'idle') {
            solveStateElement.innerText = 'Idle';
            solveStateElement.classList.add('status-idle');
        } else if (state === 'running') {
            solveStateElement.innerText = 'Solving...';
            solveStateElement.classList.add('status-running');
        } else if (state === 'paused') {
            solveStateElement.innerText = 'Paused';
            solveStateElement.classList.add('status-paused');
        } else if (state === 'complete') {
            solveStateElement.innerText = 'Complete';
            solveStateElement.classList.add('status-complete');
        }
    }

    // Event Listeners for Game Controls
    newGameBtn.addEventListener('click', initGame);
    
    difficultySelect.addEventListener('change', () => {
        // Auto start new game on difficulty change
        initGame();
    });

    algoSelect.addEventListener('change', (e) => {
        algoHelpText.innerText = algoDescriptions[e.target.value];
    });

    speedSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        if (val === 0) {
            speedValue.innerText = 'Instant (0ms)';
        } else {
            speedValue.innerText = `${val}ms`;
        }
        solver.setDelay(val);
    });

    // AI Solve Event Listeners
    solveBtn.addEventListener('click', startAISolve);

    pauseBtn.addEventListener('click', () => {
        if (solver.isPaused) {
            solver.resume();
            pauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
            updateSolveState('running');
        } else {
            solver.pause();
            pauseBtn.innerHTML = '<i class="fa-solid fa-play"></i> Resume';
            updateSolveState('paused');
        }
    });

    stopBtn.addEventListener('click', stopSolvingProcess);

    // Virtual Numpad Handler
    numButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.dataset.value;
            if (val === 'clear') {
                enterNumber(0);
            } else {
                enterNumber(parseInt(val));
            }
        });
    });

    // Keyboard controls handler
    document.addEventListener('keydown', (e) => {
        if (isSolving) return;

        // Navigate with Arrow keys
        if (selectedCell) {
            let { row, col } = selectedCell;
            if (e.key === 'ArrowUp') {
                row = (row - 1 + 9) % 9;
                selectCell(row, col);
                e.preventDefault();
                return;
            } else if (e.key === 'ArrowDown') {
                row = (row + 1) % 9;
                selectCell(row, col);
                e.preventDefault();
                return;
            } else if (e.key === 'ArrowLeft') {
                col = (col - 1 + 9) % 9;
                selectCell(row, col);
                e.preventDefault();
                return;
            } else if (e.key === 'ArrowRight') {
                col = (col + 1) % 9;
                selectCell(row, col);
                e.preventDefault();
                return;
            }
        }

        // Input numbers
        if (e.key >= '1' && e.key <= '9') {
            enterNumber(parseInt(e.key));
        } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
            enterNumber(0);
        }
    });

    // Close Modal Handler
    modalCloseBtn.addEventListener('click', () => {
        victoryModal.classList.remove('active');
        initGame();
    });

    // Initial game boot
    initGame();
});
