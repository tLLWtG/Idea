console.clear();

// DOM Nodes
const $ = selector => document.querySelector(selector);
const gridNode = $('.grid');
const startBtn = $('.start-btn');
const bestTimeBtn = $('.best-time-btn');
const difficultySelectNode = $('.difficulty-select');

// Game Constants
let difficulty = 3;
let nextDifficulty = 3;
const cells = [];

// Game State
let firstGame = true;
let currentValue = 1;
let viewTime = 0;
let recallTime = 0;

const GAME_STATE = {
	START: 'START',
	IN_PLAY: 'IN_PLAY',
	END: 'END'
};
let gameState = GAME_STATE.END;


// Generate difficulty select buttons
const difficultyBtns = [];
for (let i=3; i<=9; i++) {
	const btn = document.createElement('button');
	btn.type = 'button';
	btn.textContent = i;
	difficultySelectNode.appendChild(btn);
	difficultyBtns.push({
		value: i,
		node: btn
	});
	
	btn.addEventListener('click', () => {
		nextDifficulty = i;
		showSelectedDifficulty();
		if (!firstGame && (gameState === GAME_STATE.START || gameState === GAME_STATE.END)) {
			resetBoard();
		}
	});
}

function showSelectedDifficulty() {
	difficultyBtns.forEach(btn => {
		btn.node.classList.toggle('selected', btn.value === nextDifficulty)
	});
}

showSelectedDifficulty();

// Generate board
for (let i=0; i<40; i++) {
	const cellNode = document.createElement('div');
	const textNode = document.createElement('div');
	cellNode.classList.add('cell');
	cellNode.appendChild(textNode);
	gridNode.appendChild(cellNode);
	
	const cell = {
		value: null,
		covered: false,
		node: cellNode,
		setValue(value) {
			this.value = value;
			textNode.textContent = value;
		},
		cover() {
			this.covered = true;
			cellNode.classList.add('covered');
		},
		uncover() {
			this.covered = false;
			cellNode.classList.remove('covered');
		}
	};
	
	cellNode.addEventListener('click', (event) => {
		// iOS was triggering double-tap zooming without this.
		event.preventDefault();
		event.stopPropagation();
		
		if (gameState === GAME_STATE.START && cell.value === 1) {
			beginGame();
			cell.uncover();
			currentValue++;
		}
		else if (gameState === GAME_STATE.IN_PLAY) {
			cell.uncover();
			if (cell.value !== currentValue) {
				handleEnd();
			} else {
				if (cell.value === difficulty) {
					handleWin();
				} else {
					currentValue++;
				}
			}
		}
	});
	
	cells.push(cell);
}



function toggleError(toggle) {
	gridNode.classList.toggle('error', toggle);
}


let _resetTime = 0;
let _startTime = 0;
function resetBoard() {
	firstGame = false;
	difficulty = nextDifficulty;
	startBtn.textContent = 'Restart';
	toggleError(false);
	
	// reset state
	currentValue = 1;
	gameState = GAME_STATE.START;
	viewTime = 0;
	recallTime = 0;
	_resetTime = Date.now();
	renderTimes();
	
	// reset board
	cells.forEach(cell => {
		cell.uncover();
		cell.setValue(null);
	});
	
	for (let n=1; n<=difficulty; n++) {
		let randomCell;
		do {
			randomCell = cells[Math.random() * cells.length | 0];
		} while (randomCell.value);
		
		randomCell.setValue(n);
	}
}

function beginGame() {
		gameState = GAME_STATE.IN_PLAY;
		viewTime = Date.now() - _resetTime;
		_startTime = Date.now();
		renderTimes();
		cells.forEach(cell => cell.cover());
}

function renderTimes() {
	// Using alerts for now, don't need to render times to DOM.
}

function handleEnd() {
	gameState = GAME_STATE.END;
	cells.forEach(cell => cell.uncover());
	toggleError(true);
}

function handleWin() {
	gameState = GAME_STATE.END;
	recallTime = Date.now() - _startTime;
	const bestTime = readBestTime();
	saveBestTimeIfNeeded();
	const bestTimeTotal = bestTime ? (bestTime.viewTime + bestTime.recallTime) : Infinity;
	const currentTotal = viewTime + recallTime;
	const newBestTime = currentTotal < bestTimeTotal;
	setTimeout(() => window.alert(
`${newBestTime ? 'NEW BEST TIME!' : 'YOUR TIME'} (Difficulty: ${difficulty})
${generateTimeMessage(viewTime, recallTime)}
${'-'.repeat(30)}
${newBestTime ? 'YOUR PREVIOUS BEST' : 'YOUR BEST TIME'} (Difficulty: ${difficulty})
${bestTime ? generateTimeMessage(bestTime.viewTime, bestTime.recallTime) : 'N/A'}`
	));
}



function generateTimeMessage(viewTime, recallTime) {
	return `Memorize Time: ${(viewTime/1000).toFixed(2)}s\nRecall Time: ${(recallTime/1000).toFixed(2)}s\nTotal Time: ${((viewTime + recallTime)/1000).toFixed(2)}s`;
}


startBtn.addEventListener('click', resetBoard);
bestTimeBtn.addEventListener('click', () => {
	const bestTime = readBestTime(nextDifficulty);
	window.alert(bestTime
		? `YOUR BEST TIME (Difficulty: ${nextDifficulty})\n${generateTimeMessage(bestTime.viewTime, bestTime.recallTime)}`
		: `You haven’t completed difficulty ${nextDifficulty} yet.`
	);
});


// Helpers to read/persist best times.
// A unique set of best times is saved for each difficulty level.

const storageKey = 'CTHTestBestTimes';

function readBestTime(readDifficulty=difficulty) {
	const data = localStorage[storageKey];
	if (data) {
		const bestTimes = JSON.parse(data);
		return bestTimes[String(readDifficulty)];
	}
	return null;
}

function saveBestTimeIfNeeded() {
	const bestTime = readBestTime();
	const bestTimeTotal = bestTime ? (bestTime.viewTime + bestTime.recallTime) : Infinity;
	const currentTotal = viewTime + recallTime;
	if (currentTotal < bestTimeTotal) {
		const data = localStorage[storageKey];
		const bestTimes = data ? JSON.parse(data) : {};
		bestTimes[String(difficulty)] = { viewTime, recallTime };
		localStorage[storageKey] = JSON.stringify(bestTimes);
	}
}
