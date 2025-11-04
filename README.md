# Sandcastle Defense Game

A web-based tower defense game where you must protect your sandcastle from incoming ocean waves by building walls and strategic defenses.

## How to Play

### Game Objective
Build and maintain a fortress of walls around your sandcastle to protect it from waves. Each wave damages your walls, and if water reaches your castle twice, you lose!

### Controls

1. **Place Initial Castle**: At the start, click anywhere on the grid to place your first sandcastle
2. **Build Walls**: Click any empty grid square to build a wall
3. **Add Castle**: Click the "Add Castle" button, then click on the grid to place additional castles
4. **Add Dam**: Click the "Add Dam" button, then click on an existing wall to convert it into a dam (allows controlled water flow)
5. **Build Walls**: Click "Build Walls" button to return to normal wall-building mode

### Game Mechanics

#### Walls
- Click empty grid squares to build walls
- Adjacent walls connect to form continuous barriers
- Walls can withstand 5 hits from water before collapsing
- Damaged walls appear smaller and darker (wet sand)
- Walls block water flow and force it to spread sideways

#### Waves
- Waves come from the ocean (bottom of the screen) every 30 seconds
- Water flows upward with momentum
- When water hits a wall, it damages the wall and spreads to adjacent areas
- Water can curl around walls and flow back from behind if there are gaps
- If water reaches your castle, it damages it

#### Castles
- Each castle can withstand 2 hits from water
- Damaged castles appear darker and show cracks
- When any castle loses all health, the game is over
- You can place multiple castles for strategic advantage

#### Dams
- Dams are modified walls with a gap that allows water through
- Water flowing through a dam only deals 50% damage to the dam
- Dams can be used to control water flow strategically
- Water that passes through dams must still be blocked by other walls

### Strategy Tips

1. Build thick wall barriers with multiple layers
2. Create complete enclosures around your castle - don't leave gaps in the back!
3. Use dams strategically to redirect water flow
4. Watch the timer and reinforce weak spots between waves
5. Remember that water can curl around and attack from behind

## Technical Details

- **Grid Size**: 30 rows × 40 columns
- **Wave Interval**: 30 seconds
- **Wall Durability**: 5 hits
- **Castle Durability**: 2 hits
- **Dam Damage Reduction**: 50%

## Files

- `index.html` - Main HTML structure
- `styles.css` - Game styling and UI
- `game.js` - Core game logic and mechanics

## Running the Game

Simply open `index.html` in a modern web browser. No server or build process required!

## Browser Compatibility

Works best in modern browsers with HTML5 Canvas support:
- Chrome/Edge (recommended)
- Firefox
- Safari

## Features

- Grid-based building system
- Realistic water flow simulation with momentum
- Visual feedback for damage (walls shrink and darken)
- Wave receding mechanics (water curls back)
- Multiple game modes (build walls, place castles, add dams)
- Timer countdown to next wave
- Game over screen with survival time
- Photorealistic art style with sand and water textures

Enjoy defending your sandcastle!
