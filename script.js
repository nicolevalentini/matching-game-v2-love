const symbols = ['😻','💕','🫶','🫀','🔥','🧸','💋','🎁','💐','🎀','💌','🍫'];
const tiles = symbols.concat(symbols); // double the symbols for matching
let firstTile = null;
let canClick = true;
let gameTimer;
let timeRemaining = 120;

// Reference to the background music element
const backgroundMusic = document.getElementById('backgroundMusic');

function shuffleArray(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function startGame() {
  const gameBoard = document.getElementById('gameBoard');
  const timerContainer = document.getElementById('timerContainer');
  const timerText = document.getElementById('timerText');
  
  // Reset game state
  document.getElementById('envelopeContainer').style.display = 'none';
  document.getElementById('instructionsBox').style.opacity = '1';
  gameBoard.style.display = 'flex';
  gameBoard.innerHTML = '';
  timeRemaining = 120;
  timerText.innerText = timeRemaining;
  
  // Show timer
  timerContainer.style.display = 'flex';
  timerContainer.classList.remove('timer-warning');

  const shuffled = shuffleArray([...tiles]);
  shuffled.forEach((symbol, index) => {
    const tile = document.createElement('div');
    tile.className = 'game-tile';
    tile.dataset.symbol = symbol;
    tile.dataset.index = index;
    tile.innerText = '';
    tile.onclick = () => handleTileClick(tile);
    gameBoard.appendChild(tile);
  });
  
  // Start the countdown
  startCountdown();

  // Play background music
  if (backgroundMusic) {
    backgroundMusic.currentTime = 0; // Reset to start
    backgroundMusic.play().catch(e => console.log("Could not play background music"));
    backgroundMusic.loop = true; // Loop the music
  }
}

function startCountdown() {
  // Clear any existing timer
  clearInterval(gameTimer);
  
  gameTimer = setInterval(() => {
    timeRemaining--;
    const timerText = document.getElementById('timerText');
    const timerContainer = document.getElementById('timerContainer');
    timerText.innerText = timeRemaining;
    
    // Add warning style when time is running low
    if (timeRemaining <= 10) {
      timerContainer.classList.add('timer-warning');
      
      // Optional: play a tick sound when time is low
      if (timeRemaining <= 5) {
        const tickSound = document.getElementById('tickSound');
        if (tickSound) {
          tickSound.currentTime = 0;
          tickSound.play().catch(e => console.log("Could not play tick sound"));
        }
      }
    }
    
    if (timeRemaining <= 0) {
      clearInterval(gameTimer);
      endGame(false);
    }
  }, 1000);
}

function endGame(won) {
  // Stop the timer
  clearInterval(gameTimer);
  
  // Hide the timer
  document.getElementById('timerContainer').style.display = 'none';
  
  // Stop background music
  if (backgroundMusic) {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0; // Reset to start
  }

  if (won) {
    // Current win logic
    celebrateWin();
  } else {
    // Time ran out
    const timeoutSound = document.getElementById('timeoutSound');
    if (timeoutSound) {
      timeoutSound.currentTime = 0;
      timeoutSound.play().catch(e => console.log("Could not play timeout sound"));
    }
    
    document.getElementById('gameBoard').style.display = 'none';
    document.getElementById('instructionsBox').style.opacity = '1';
    
    // Update instructions to show game over message
    const instructionsBox = document.getElementById('instructionsBox');
    instructionsBox.innerHTML = `
      <h1>Time's Up!</h1>
      <p>You ran out of time. Would you like to try again?</p>
      <button class="start-button" onclick="startGame()">Play Again</button>
    `;
  }
}

function handleTileClick(tile) {
  if (!canClick || tile.innerText !== '') return;
  const clickSound = document.getElementById('clickSound');
  clickSound.currentTime = 0;
  clickSound.play();

  tile.innerText = tile.dataset.symbol;

  if (!firstTile) {
    firstTile = tile;
  } else {
    canClick = false;
    if (firstTile.dataset.symbol === tile.dataset.symbol && firstTile !== tile) {
      const matchSound = document.getElementById('matchSound');
      matchSound.currentTime = 0;
      matchSound.play();
      firstTile = null;
      canClick = true;
      checkWin();
    } else {
      setTimeout(() => {
        tile.innerText = '';
        firstTile.innerText = '';
        firstTile = null;
        canClick = true;
      }, 1000);
    }
  }
}

function checkWin() {
  const allTiles = document.querySelectorAll('.game-tile');
  const allRevealed = [...allTiles].every(tile => tile.innerText !== '');
  if (allRevealed) {
    // Player won - stop timer and celebrate
    clearInterval(gameTimer);
    document.getElementById('timerContainer').style.display = 'none';
    celebrateWin();
  }
}

function celebrateWin() {
  // Hide the game board and instructions
  document.getElementById('gameBoard').style.display = 'none';
  document.getElementById('instructionsBox').style.opacity = '0';
  
  // Stop background music
  if (backgroundMusic) {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0; // Reset to start
  }
  
  // Show envelope animation
  document.getElementById('envelopeContainer').style.display = 'block';
  
  // Play win sound
  const winSound = document.getElementById('winSound');
  if(winSound) {
    winSound.currentTime = 0;
    winSound.play();
  }
  
  // Create confetti
  createConfetti();
  
  // Animate envelope opening
  setTimeout(() => {
    document.getElementById('envelopeFlap').classList.add('open');
    
    // Play envelope sound when the envelope opens
    const envelopeSound = document.getElementById('envelopeSound');
    if(envelopeSound) {
      envelopeSound.currentTime = 0;
      envelopeSound.play();
    }
    
    setTimeout(() => {
      document.getElementById('envelopeLetter').classList.add('reveal');
      
      setTimeout(() => {
        document.getElementById('messageContent').classList.add('show');
      }, 500);
    }, 1000);
  }, 500);
}

function createConfetti() {
  const confettiContainer = document.getElementById('confetti');
  const colors = ['#ff8563', '#ffce47', '#a5dd9b', '#60c1e8', '#f588eb'];
  
  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement('div');
    confetti.style.position = 'absolute';
    confetti.style.width = Math.random() * 10 + 5 + 'px';
    confetti.style.height = Math.random() * 10 + 5 + 'px';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.top = -20 + 'px';
    confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    confetti.style.opacity = Math.random() * 0.7 + 0.3;
    
    confettiContainer.appendChild(confetti);
    
    // Animate confetti
    const duration = Math.random() * 3 + 2;
    const rotation = Math.random() * 360;
    
    confetti.animate([
      { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
      { transform: `translateY(100vh) rotate(${rotation}deg)`, opacity: 0 }
    ], {
      duration: duration * 1000,
      easing: 'cubic-bezier(0.17, 0.67, 0.83, 0.67)',
      fill: 'forwards'
    });
    
    // Remove confetti element after animation
    setTimeout(() => {
      confetti.remove();
    }, duration * 1000);
  }
}