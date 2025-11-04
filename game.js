// Game Constants
const GRID_ROWS = 30;
const GRID_COLS = 40;
const CELL_SIZE = 20;
const WAVE_INTERVAL = 30000; // 30 seconds
const WALL_MAX_HITS = 5;
const CASTLE_MAX_HITS = 2;

// Cell Types
const CELL_TYPE = {
    EMPTY: 'empty',
    WALL: 'wall',
    CASTLE: 'castle',
    DAM: 'dam',
    WATER: 'water'
};

// Game Modes
const MODE = {
    PLACE_CASTLE: 'place_castle',
    BUILD_WALL: 'build_wall',
    ADD_CASTLE: 'add_castle',
    ADD_DAM: 'add_dam'
};

// Game State
class GameState {
    constructor() {
        this.grid = [];
        this.mode = MODE.PLACE_CASTLE;
        this.timeUntilWave = WAVE_INTERVAL / 1000;
        this.waveTimer = null;
        this.gameStartTime = Date.now();
        this.isGameOver = false;
        this.castles = [];
        this.waterCells = [];
        this.isWaveActive = false;
        this.initialCastlePlaced = false;

        this.initGrid();
    }

    initGrid() {
        for (let row = 0; row < GRID_ROWS; row++) {
            this.grid[row] = [];
            for (let col = 0; col < GRID_COLS; col++) {
                this.grid[row][col] = {
                    type: CELL_TYPE.EMPTY,
                    hits: 0,
                    waterLevel: 0
                };
            }
        }
    }

    reset() {
        this.grid = [];
        this.mode = MODE.PLACE_CASTLE;
        this.timeUntilWave = WAVE_INTERVAL / 1000;
        this.gameStartTime = Date.now();
        this.isGameOver = false;
        this.castles = [];
        this.waterCells = [];
        this.isWaveActive = false;
        this.initialCastlePlaced = false;

        if (this.waveTimer) {
            clearInterval(this.waveTimer);
        }

        this.initGrid();
    }
}

// Cell class to manage individual grid cells
class Cell {
    constructor(row, col, type = CELL_TYPE.EMPTY) {
        this.row = row;
        this.col = col;
        this.type = type;
        this.hits = 0;
        this.waterLevel = 0;
    }
}

// Game class
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = new GameState();

        this.setupCanvas();
        this.setupEventListeners();
        this.showInstructions();
    }

    setupCanvas() {
        this.canvas.width = GRID_COLS * CELL_SIZE;
        this.canvas.height = GRID_ROWS * CELL_SIZE;
    }

    setupEventListeners() {
        // Canvas click
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

        // Menu buttons
        document.getElementById('add-castle-btn').addEventListener('click', () => {
            this.setMode(MODE.ADD_CASTLE);
        });

        document.getElementById('add-dam-btn').addEventListener('click', () => {
            this.setMode(MODE.ADD_DAM);
        });

        document.getElementById('normal-mode-btn').addEventListener('click', () => {
            this.setMode(MODE.BUILD_WALL);
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restart();
        });

        document.getElementById('close-instructions-btn').addEventListener('click', () => {
            document.getElementById('instructions').classList.add('hidden');
        });
    }

    showInstructions() {
        document.getElementById('instructions').classList.remove('hidden');
    }

    setMode(mode) {
        this.state.mode = mode;

        // Update button states
        document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));

        if (mode === MODE.ADD_CASTLE) {
            document.getElementById('add-castle-btn').classList.add('active');
        } else if (mode === MODE.ADD_DAM) {
            document.getElementById('add-dam-btn').classList.add('active');
        } else if (mode === MODE.BUILD_WALL) {
            document.getElementById('normal-mode-btn').classList.add('active');
        }
    }

    handleCanvasClick(e) {
        if (this.state.isGameOver) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const col = Math.floor(x / CELL_SIZE);
        const row = Math.floor(y / CELL_SIZE);

        if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return;

        const cell = this.state.grid[row][col];

        if (this.state.mode === MODE.PLACE_CASTLE || this.state.mode === MODE.ADD_CASTLE) {
            if (cell.type === CELL_TYPE.EMPTY) {
                cell.type = CELL_TYPE.CASTLE;
                cell.hits = 0;
                this.state.castles.push({ row, col, hits: 0 });

                if (!this.state.initialCastlePlaced) {
                    this.state.initialCastlePlaced = true;
                    this.setMode(MODE.BUILD_WALL);
                    this.startWaveTimer();
                } else {
                    this.setMode(MODE.BUILD_WALL);
                }
            }
        } else if (this.state.mode === MODE.BUILD_WALL) {
            if (cell.type === CELL_TYPE.EMPTY) {
                cell.type = CELL_TYPE.WALL;
                cell.hits = 0;
            }
        } else if (this.state.mode === MODE.ADD_DAM) {
            if (cell.type === CELL_TYPE.WALL) {
                cell.type = CELL_TYPE.DAM;
                this.setMode(MODE.BUILD_WALL);
            }
        }
    }

    startWaveTimer() {
        this.state.waveTimer = setInterval(() => {
            this.state.timeUntilWave--;
            document.getElementById('wave-timer').textContent = this.state.timeUntilWave;

            if (this.state.timeUntilWave <= 0) {
                this.triggerWave();
                this.state.timeUntilWave = WAVE_INTERVAL / 1000;
            }
        }, 1000);
    }

    triggerWave() {
        if (this.state.isWaveActive) return;

        this.state.isWaveActive = true;
        this.simulateWave();
    }

    simulateWave() {
        // Clear previous water
        this.state.waterCells = [];

        // Water starts from bottom rows (ocean)
        const waveHeight = 8; // Height of initial wave
        const waveStartRow = GRID_ROWS - 1;

        // Initialize water at bottom
        for (let row = waveStartRow; row > waveStartRow - waveHeight; row--) {
            for (let col = 0; col < GRID_COLS; col++) {
                if (this.state.grid[row][col].type === CELL_TYPE.EMPTY) {
                    this.state.grid[row][col].waterLevel = 1.0;
                    this.state.waterCells.push({ row, col, momentum: -1 }); // negative = moving up
                }
            }
        }

        // Simulate wave propagation
        this.propagateWave(0);
    }

    propagateWave(step) {
        if (step > 60) { // Max steps to prevent infinite loop
            this.state.isWaveActive = false;
            this.clearWater();
            return;
        }

        setTimeout(() => {
            let newWaterCells = [];
            let cellsToUpdate = new Set();

            // Process each water cell
            for (let water of this.state.waterCells) {
                const { row, col, momentum } = water;

                // Try to move in momentum direction
                let nextRow = row + momentum;

                // If at edge or hit obstacle, try to spread sideways
                if (nextRow < 0 || nextRow >= GRID_ROWS) {
                    // Try spreading sideways
                    this.spreadWater(row, col, newWaterCells, cellsToUpdate);
                } else {
                    const nextCell = this.state.grid[nextRow][col];

                    if (nextCell.type === CELL_TYPE.EMPTY || nextCell.waterLevel > 0) {
                        // Can move forward
                        if (nextCell.waterLevel === 0) {
                            nextCell.waterLevel = 0.8;
                            newWaterCells.push({ row: nextRow, col, momentum });
                            cellsToUpdate.add(`${nextRow},${col}`);
                        }
                    } else if (nextCell.type === CELL_TYPE.WALL) {
                        // Hit a wall - damage it and spread sideways
                        this.damageWall(nextRow, col, 1.0);
                        this.spreadWater(row, col, newWaterCells, cellsToUpdate);
                    } else if (nextCell.type === CELL_TYPE.DAM) {
                        // Water goes through dam with reduced damage
                        this.damageWall(nextRow, col, 0.5);
                        if (nextCell.waterLevel === 0) {
                            nextCell.waterLevel = 0.6;
                            newWaterCells.push({ row: nextRow, col, momentum });
                            cellsToUpdate.add(`${nextRow},${col}`);
                        }
                        this.spreadWater(row, col, newWaterCells, cellsToUpdate);
                    } else if (nextCell.type === CELL_TYPE.CASTLE) {
                        // Hit castle - damage it
                        this.damageCastle(nextRow, col);
                        this.spreadWater(row, col, newWaterCells, cellsToUpdate);
                    }
                }

                // Current cell keeps some water
                if (Math.random() > 0.3) {
                    newWaterCells.push({ row, col, momentum });
                }
            }

            this.state.waterCells = newWaterCells;

            // Receding wave (curl back)
            if (step > 30) {
                this.simulateRecede();
            }

            this.render();

            if (this.state.waterCells.length > 0) {
                this.propagateWave(step + 1);
            } else {
                this.state.isWaveActive = false;
                this.clearWater();
            }
        }, 100);
    }

    spreadWater(row, col, newWaterCells, cellsToUpdate) {
        // Spread to adjacent cells
        const directions = [
            { dr: 0, dc: -1 }, // left
            { dr: 0, dc: 1 },  // right
            { dr: -1, dc: 0 }, // up
            { dr: 1, dc: 0 }   // down
        ];

        for (let dir of directions) {
            const newRow = row + dir.dr;
            const newCol = col + dir.dc;

            if (newRow >= 0 && newRow < GRID_ROWS && newCol >= 0 && newCol < GRID_COLS) {
                const cell = this.state.grid[newRow][newCol];
                const cellKey = `${newRow},${newCol}`;

                if (!cellsToUpdate.has(cellKey)) {
                    if (cell.type === CELL_TYPE.EMPTY && cell.waterLevel === 0) {
                        cell.waterLevel = 0.5;
                        newWaterCells.push({ row: newRow, col: newCol, momentum: dir.dr !== 0 ? dir.dr : (Math.random() > 0.5 ? -1 : 1) });
                        cellsToUpdate.add(cellKey);
                    } else if (cell.type === CELL_TYPE.WALL) {
                        this.damageWall(newRow, newCol, 0.3);
                    } else if (cell.type === CELL_TYPE.CASTLE) {
                        this.damageCastle(newRow, newCol);
                    }
                }
            }
        }
    }

    simulateRecede() {
        // Water recedes back to ocean (flows back down)
        for (let row = 0; row < GRID_ROWS; row++) {
            for (let col = 0; col < GRID_COLS; col++) {
                if (this.state.grid[row][col].waterLevel > 0) {
                    this.state.grid[row][col].waterLevel *= 0.8;
                    if (this.state.grid[row][col].waterLevel < 0.1) {
                        this.state.grid[row][col].waterLevel = 0;
                    }
                }
            }
        }
    }

    clearWater() {
        for (let row = 0; row < GRID_ROWS; row++) {
            for (let col = 0; col < GRID_COLS; col++) {
                this.state.grid[row][col].waterLevel = 0;
            }
        }
        this.render();
    }

    damageWall(row, col, damageAmount) {
        const cell = this.state.grid[row][col];

        if (cell.type === CELL_TYPE.WALL || cell.type === CELL_TYPE.DAM) {
            cell.hits += damageAmount;

            if (cell.hits >= WALL_MAX_HITS) {
                cell.type = CELL_TYPE.EMPTY;
                cell.hits = 0;
            }
        }
    }

    damageCastle(row, col) {
        const cell = this.state.grid[row][col];

        if (cell.type === CELL_TYPE.CASTLE) {
            cell.hits++;

            // Update castle in state
            const castle = this.state.castles.find(c => c.row === row && c.col === col);
            if (castle) {
                castle.hits = cell.hits;
            }

            // Update health display (use minimum castle health)
            const minHealth = CASTLE_MAX_HITS - Math.max(...this.state.castles.map(c => c.hits));
            document.getElementById('castle-health').textContent = Math.max(0, minHealth);

            if (cell.hits >= CASTLE_MAX_HITS) {
                this.gameOver();
            }
        }
    }

    gameOver() {
        this.state.isGameOver = true;
        clearInterval(this.state.waveTimer);

        const survivalTime = Math.floor((Date.now() - this.state.gameStartTime) / 1000);
        document.getElementById('survival-time').textContent = survivalTime;
        document.getElementById('game-over').classList.remove('hidden');
    }

    restart() {
        document.getElementById('game-over').classList.add('hidden');
        this.state.reset();
        document.getElementById('castle-health').textContent = CASTLE_MAX_HITS;
        document.getElementById('wave-timer').textContent = WAVE_INTERVAL / 1000;
        this.setMode(MODE.PLACE_CASTLE);
        this.render();
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw gradient background (sand to ocean)
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#f4e4c1');    // Light sand
        gradient.addColorStop(0.6, '#e8d4a8');  // Medium sand
        gradient.addColorStop(0.8, '#d4c499');  // Dark sand
        gradient.addColorStop(1, '#4A90E2');    // Ocean

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        for (let row = 0; row < GRID_ROWS; row++) {
            for (let col = 0; col < GRID_COLS; col++) {
                this.drawCell(row, col);
            }
        }

        // Draw grid lines (subtle)
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.lineWidth = 0.5;

        for (let row = 0; row <= GRID_ROWS; row++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, row * CELL_SIZE);
            this.ctx.lineTo(GRID_COLS * CELL_SIZE, row * CELL_SIZE);
            this.ctx.stroke();
        }

        for (let col = 0; col <= GRID_COLS; col++) {
            this.ctx.beginPath();
            this.ctx.moveTo(col * CELL_SIZE, 0);
            this.ctx.lineTo(col * CELL_SIZE, GRID_ROWS * CELL_SIZE);
            this.ctx.stroke();
        }
    }

    drawCell(row, col) {
        const cell = this.state.grid[row][col];
        const x = col * CELL_SIZE;
        const y = row * CELL_SIZE;

        if (cell.type === CELL_TYPE.CASTLE) {
            this.drawCastle(x, y, cell.hits);
        } else if (cell.type === CELL_TYPE.WALL) {
            this.drawWall(x, y, cell.hits);
        } else if (cell.type === CELL_TYPE.DAM) {
            this.drawDam(x, y, cell.hits);
        }

        // Draw water overlay
        if (cell.waterLevel > 0) {
            this.drawWater(x, y, cell.waterLevel);
        }
    }

    drawCastle(x, y, hits) {
        const damage = hits / CASTLE_MAX_HITS;

        // Castle color - gets darker and more damaged
        const baseColor = this.interpolateColor('#e8d4a8', '#8b7355', damage);

        this.ctx.fillStyle = baseColor;

        // Main tower
        const towerWidth = CELL_SIZE * 0.8;
        const towerHeight = CELL_SIZE * 0.9;
        const towerX = x + (CELL_SIZE - towerWidth) / 2;
        const towerY = y + (CELL_SIZE - towerHeight);

        // Draw tower with battlements
        this.ctx.fillRect(towerX, towerY, towerWidth, towerHeight);

        // Battlements
        const battWidth = towerWidth / 5;
        for (let i = 0; i < 5; i++) {
            if (i % 2 === 0) {
                this.ctx.fillRect(towerX + i * battWidth, towerY - 3, battWidth, 3);
            }
        }

        // Window
        this.ctx.fillStyle = '#5a4a3a';
        this.ctx.fillRect(towerX + towerWidth / 2 - 2, towerY + towerHeight / 2, 4, 6);

        // Add cracks if damaged
        if (damage > 0) {
            this.ctx.strokeStyle = '#5a4a3a';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(towerX + 2, towerY + 5);
            this.ctx.lineTo(towerX + 8, towerY + 12);
            this.ctx.stroke();

            if (damage > 0.5) {
                this.ctx.beginPath();
                this.ctx.moveTo(towerX + towerWidth - 5, towerY + 8);
                this.ctx.lineTo(towerX + towerWidth - 2, towerY + 15);
                this.ctx.stroke();
            }
        }

        // Border
        this.ctx.strokeStyle = '#8b7355';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(towerX, towerY, towerWidth, towerHeight);
    }

    drawWall(x, y, hits) {
        const damage = hits / WALL_MAX_HITS;

        // Wall gets darker and smaller as it takes damage
        const wallColor = this.interpolateColor('#c4a574', '#8b7355', damage);
        const sizeReduction = damage * 0.3; // Shrink by up to 30%

        const wallSize = CELL_SIZE * (0.9 - sizeReduction);
        const offset = (CELL_SIZE - wallSize) / 2;

        this.ctx.fillStyle = wallColor;
        this.ctx.fillRect(x + offset, y + offset, wallSize, wallSize);

        // Add texture
        this.ctx.strokeStyle = '#a08960';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x + offset, y + offset, wallSize, wallSize);

        // Sand texture lines
        this.ctx.strokeStyle = 'rgba(139, 115, 85, 0.3)';
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x + offset, y + offset + (wallSize / 3) * i);
            this.ctx.lineTo(x + offset + wallSize, y + offset + (wallSize / 3) * i);
            this.ctx.stroke();
        }
    }

    drawDam(x, y, hits) {
        // Draw like a wall but with a gap in the middle
        const damage = hits / WALL_MAX_HITS;
        const wallColor = this.interpolateColor('#c4a574', '#8b7355', damage);
        const sizeReduction = damage * 0.3;

        const wallSize = CELL_SIZE * (0.9 - sizeReduction);
        const offset = (CELL_SIZE - wallSize) / 2;
        const gapSize = wallSize * 0.3;

        this.ctx.fillStyle = wallColor;

        // Left part
        this.ctx.fillRect(x + offset, y + offset, (wallSize - gapSize) / 2, wallSize);

        // Right part
        this.ctx.fillRect(x + offset + (wallSize + gapSize) / 2, y + offset, (wallSize - gapSize) / 2, wallSize);

        // Border
        this.ctx.strokeStyle = '#8b7355';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x + offset, y + offset, wallSize, wallSize);

        // Gap indicator
        this.ctx.strokeStyle = '#4A90E2';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x + CELL_SIZE / 2, y + offset);
        this.ctx.lineTo(x + CELL_SIZE / 2, y + offset + wallSize);
        this.ctx.stroke();
    }

    drawWater(x, y, level) {
        const alpha = level * 0.6;
        this.ctx.fillStyle = `rgba(74, 144, 226, ${alpha})`;
        this.ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

        // Water sparkle effect
        if (Math.random() > 0.8) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
            this.ctx.fillRect(x + Math.random() * CELL_SIZE, y + Math.random() * CELL_SIZE, 2, 2);
        }
    }

    interpolateColor(color1, color2, factor) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);

        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);

        return `rgb(${r}, ${g}, ${b})`;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    start() {
        this.render();

        // Game loop for animations
        const gameLoop = () => {
            if (!this.state.isGameOver) {
                this.render();
            }
            requestAnimationFrame(gameLoop);
        };

        gameLoop();
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    const game = new Game();
    game.start();
});
