class SudokuSolver {
    constructor() {
        this.isSolving = false;
        this.isPaused = false;
        this.delay = 50;
        this.onStep = null;
        this.stepsCount = 0;
    }

    setDelay(ms) {
        this.delay = ms;
    }

    async waitIfNeeded() {
        while (this.isPaused && this.isSolving) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        if (!this.isSolving) return false;
        if (this.delay > 0) {
            await new Promise(resolve => setTimeout(resolve, this.delay));
        }
        return this.isSolving;
    }

    isValid(board, row, col, val) {
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === val && i !== col) return false;
            if (board[i][col] === val && i !== row) return false;
            
            const r = 3 * Math.floor(row / 3) + Math.floor(i / 3);
            const c = 3 * Math.floor(col / 3) + i % 3;
            if (board[r][c] === val && (r !== row || c !== col)) return false;
        }
        return true;
    }

    // Get all valid choices for a given cell
    getValidChoices(board, row, col) {
        const choices = [];
        for (let val = 1; val <= 9; val++) {
            if (this.isValid(board, row, col, val)) {
                choices.push(val);
            }
        }
        return choices;
    }

    // Find first empty cell (Standard backtracking)
    findEmptyCell(board) {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0) return { row: r, col: c };
            }
        }
        return null;
    }

    // Find cell with Minimum Remaining Values (MRV heuristic)
    findMRVCell(board) {
        let minChoices = 10;
        let bestCell = null;

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0) {
                    const choices = this.getValidChoices(board, r, c).length;
                    if (choices < minChoices) {
                        minChoices = choices;
                        bestCell = { row: r, col: c };
                    }
                }
            }
        }
        return bestCell;
    }

    async solve(board, method = 'mrv', onStep = null, delay = 50) {
        this.isSolving = true;
        this.isPaused = false;
        this.delay = delay;
        this.onStep = onStep;
        this.stepsCount = 0;

        const success = await this.backtrackSolve(board, method);
        this.isSolving = false;
        return success ? board : null;
    }

    async backtrackSolve(board, method) {
        if (!this.isSolving) return false;

        const cell = method === 'mrv' ? this.findMRVCell(board) : this.findEmptyCell(board);
        if (!cell) return true; // Solved!

        const { row, col } = cell;
        const choices = method === 'mrv' ? this.getValidChoices(board, row, col) : [1, 2, 3, 4, 5, 6, 7, 8, 9];

        // Shuffle choices for standard backtracking to make generator outcomes more randomized
        // (For solver, standard order is fine, but for generation we want variety.
        // However, we can keep it simple or random)
        
        for (let val of choices) {
            if (method !== 'mrv' && !this.isValid(board, row, col, val)) {
                continue;
            }

            board[row][col] = val;
            this.stepsCount++;

            if (this.onStep) {
                const continueSolve = await this.onStep(row, col, val, 'try', this.stepsCount);
                if (!continueSolve) return false;
            }

            const active = await this.waitIfNeeded();
            if (!active) return false;

            if (await this.backtrackSolve(board, method)) {
                if (this.onStep) {
                    await this.onStep(row, col, val, 'success', this.stepsCount);
                }
                return true;
            }

            board[row][col] = 0;
            if (this.onStep) {
                const continueSolve = await this.onStep(row, col, 0, 'backtrack', this.stepsCount);
                if (!continueSolve) return false;
            }

            const activeBacktrack = await this.waitIfNeeded();
            if (!activeBacktrack) return false;
        }

        return false;
    }

    // A synchronous solver specifically for generator usage (fast, no delay, no callbacks)
    solveSync(board, method = 'mrv') {
        const cell = method === 'mrv' ? this.findMRVCell(board) : this.findEmptyCell(board);
        if (!cell) return true;

        const { row, col } = cell;
        const choices = this.getValidChoices(board, row, col);

        // Shuffle choices to generate random valid sudoku boards
        this.shuffleArray(choices);

        for (let val of choices) {
            board[row][col] = val;
            if (this.solveSync(board, method)) return true;
            board[row][col] = 0;
        }

        return false;
    }

    // Count solutions to ensure a generated puzzle has a unique solution
    countSolutions(board, limit = 2) {
        let count = 0;

        const solve = () => {
            const cell = this.findMRVCell(board);
            if (!cell) {
                count++;
                return count >= limit;
            }

            const { row, col } = cell;
            const choices = this.getValidChoices(board, row, col);

            for (let val of choices) {
                board[row][col] = val;
                if (solve()) return true;
                board[row][col] = 0;
            }

            return false;
        };

        solve();
        return count;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    stopSolving() {
        this.isSolving = false;
        this.isPaused = false;
    }
}
