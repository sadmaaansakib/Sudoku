class SudokuGenerator {
    constructor() {
        this.solver = new SudokuSolver();
    }

    generate(difficulty = 'medium') {
        // Step 1: Create an empty board
        let board = Array.from({ length: 9 }, () => Array(9).fill(0));

        // Step 2: Fill the board using the synchronous solver (which shuffles choices for randomization)
        this.solver.solveSync(board);

        // Keep a copy of the solution
        const solution = board.map(row => [...row]);

        // Step 3: Remove numbers depending on difficulty
        let targetClues = 35;
        if (difficulty === 'easy') targetClues = 45;
        else if (difficulty === 'medium') targetClues = 35;
        else if (difficulty === 'hard') targetClues = 28;
        else if (difficulty === 'expert') targetClues = 20;

        const cells = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                cells.push({ r, c });
            }
        }
        // Shuffle cells to randomize the removal order
        this.shuffle(cells);

        let cluesCount = 81;
        for (let cell of cells) {
            if (cluesCount <= targetClues) break;

            const { r, c } = cell;
            const tempVal = board[r][c];
            board[r][c] = 0;

            // Check if there's still a unique solution
            // Make a copy to pass to countSolutions
            const boardCopy = board.map(row => [...row]);
            if (this.solver.countSolutions(boardCopy) === 1) {
                cluesCount--;
            } else {
                board[r][c] = tempVal; // Restore if removing it creates multiple solutions
            }
        }

        return {
            puzzle: board,
            solution: solution
        };
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}
