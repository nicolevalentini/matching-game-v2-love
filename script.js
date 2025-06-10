// Browser detection and compatibility
function detectBrowser() {
  const isIE = /*@cc_on!@*/ false || !!document.documentMode
  const isEdge = !isIE && !!window.StyleMedia
  const isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime)
  const isFirefox = typeof InstallTrigger !== "undefined"
  const isSafari =
    /constructor/i.test(window.HTMLElement) ||
    ((p) => p.toString() === "[object SafariRemoteNotification]")(
      !window["safari"] || (typeof safari !== "undefined" && safari.pushNotification),
    )
  const isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(" OPR/") >= 0

  // Check for older browsers
  const isOldBrowser =
    isIE || navigator.userAgent.indexOf("MSIE") !== -1 || navigator.userAgent.indexOf("Trident/") !== -1

  return {
    isIE,
    isEdge,
    isChrome,
    isFirefox,
    isSafari,
    isOpera,
    isOldBrowser,
  }
}

// Check for animation support
function supportsAnimations() {
  const elm = document.createElement("div")
  return (
    elm.style.animationName !== undefined ||
    elm.style.WebkitAnimationName !== undefined ||
    elm.style.MozAnimationName !== undefined ||
    elm.style.msAnimationName !== undefined ||
    elm.style.OAnimationName !== undefined
  )
}

// Check for audio support
function supportsAudio() {
  const audio = document.createElement("audio")
  return !!audio.canPlayType
}

// Check for CSS Grid support
function supportsGrid() {
  return window.CSS && CSS.supports && CSS.supports("display", "grid")
}

// Apply fallbacks based on browser capabilities
function applyFallbacks() {
  const browser = detectBrowser()
  const hasAnimations = supportsAnimations()
  const hasAudio = supportsAudio()
  const hasGrid = supportsGrid()

  // Show warning for very old browsers
  if (browser.isOldBrowser) {
    document.getElementById("browserNotice").style.display = "flex"
  }

  // Apply fallbacks for grid
  if (!hasGrid) {
    const gameBoard = document.getElementById("gameBoard")
    if (gameBoard) {
      gameBoard.style.display = "flex"
      gameBoard.style.flexWrap = "wrap"
    }
  }

  // Apply fallbacks for animations
  if (!hasAnimations) {
    const style = document.createElement("style")
    style.textContent = `
      .game-tile:hover, .start-button:hover, .action-button:hover {
        margin-top: -2px;
      }
      .envelope-flap.open {
        visibility: hidden;
      }
      .envelope-letter.reveal {
        top: -30px;
      }
    `
    document.head.appendChild(style)
  }

  return {
    browser,
    hasAnimations,
    hasAudio,
    hasGrid,
  }
}

// Dismiss browser notice
function dismissNotice() {
  document.getElementById("browserNotice").style.display = "none"
}

// Game variables
const symbols = ['😻','💕','🫶','🫀','🔥','🧸','💋','🎁','💐','🎀','💌','🍫']
const tiles = symbols.concat(symbols)
let firstTile = null
let canClick = true
let gameTimer
let timeRemaining = 120
let matchedPairs = 0
let soundEnabled = true
let capabilities = null

// Initialize on page load
window.onload = () => {
  capabilities = applyFallbacks()

  // Initialize sound toggle
  const soundToggle = document.getElementById("soundToggle")
  const soundIcon = document.getElementById("soundIcon")

  // Set initial state
  soundEnabled = true
  if (soundIcon) {
    soundIcon.textContent = "🔊"
  }

  // Add click event listener
  if (soundToggle) {
    // Remove any existing listeners first
    soundToggle.onclick = null

    // Add new listener
    soundToggle.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      toggleSound()
    })
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled
  const soundIcon = document.getElementById("soundIcon")

  // Update the visual icon
  if (soundIcon) {
    soundIcon.textContent = soundEnabled ? "🔊" : "🔇"
  }

  // Handle background music
  const backgroundMusic = document.getElementById("backgroundMusic")
  if (backgroundMusic) {
    if (!soundEnabled) {
      // Turn off sound - pause music
      backgroundMusic.pause()
    } else if (gameTimer) {
      // Turn on sound during gameplay - restart music
      try {
        backgroundMusic.currentTime = 0
        backgroundMusic.volume = 0.3
        const playPromise = backgroundMusic.play()
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.log("Could not play background music: ", error)
          })
        }
        backgroundMusic.loop = true
      } catch (e) {
        console.log("Could not play background music")
      }
    }
  }
}

function updateProgress() {
  const progressText = document.getElementById("progressText")
  const progressContainer = document.getElementById("progressContainer")

  if (progressText) {
    progressText.textContent = `${matchedPairs}/${symbols.length}`
  }

  if (progressContainer) {
    progressContainer.style.display = "block"
  }
}

function resetToMenu() {
  // Stop timer and music
  clearInterval(gameTimer)
  const backgroundMusic = document.getElementById("backgroundMusic")
  if (backgroundMusic) {
    backgroundMusic.pause()
    backgroundMusic.currentTime = 0
  }

  // Hide all game elements
  document.getElementById("gameBoard").style.display = "none"
  document.getElementById("timerContainer").style.display = "none"
  document.getElementById("envelopeContainer").style.display = "none"
  document.getElementById("progressContainer").style.display = "none"

  // Show instructions
  const instructionsBox = document.getElementById("instructionsBox")
  instructionsBox.style.display = "block"
  instructionsBox.style.opacity = "1"

  // Reset instructions content
  instructionsBox.innerHTML = `
    <div class="instruction-content">
      <h2>Welcome to Memory Match!</h2>
      <p>Match all the tiles to reveal a special message.</p>
      <p class="time-info">You have 2 minutes to complete the challenge.</p>
      <button class="start-button" onclick="startGame()">
        <span class="button-icon">▶</span>
        Start Game
      </button>
    </div>
  `

  // Reset game variables
  matchedPairs = 0
  timeRemaining = 120
  firstTile = null
  canClick = true
}

function startGame() {
  const gameBoard = document.getElementById("gameBoard")
  const timerContainer = document.getElementById("timerContainer")
  const timerText = document.getElementById("timerText")
  const instructionsBox = document.getElementById("instructionsBox")

  // Reset game state
  document.getElementById("envelopeContainer").style.display = "none"
  instructionsBox.style.opacity = "0"
  setTimeout(() => {
    instructionsBox.style.display = "none"
  }, 300)

  // Use appropriate display style based on browser capabilities
  if (capabilities && !capabilities.hasGrid) {
    gameBoard.style.display = "flex"
  } else {
    gameBoard.style.display = "grid"
  }

  gameBoard.innerHTML = ""
  timeRemaining = 120
  matchedPairs = 0
  timerText.innerText = timeRemaining

  // Show timer and progress
  timerContainer.style.display = "block"
  timerContainer.classList.remove("timer-warning")
  updateProgress()

  const shuffled = shuffleArray([...tiles])
  shuffled.forEach((symbol, index) => {
    const tile = document.createElement("div")
    tile.className = "game-tile"
    tile.setAttribute("data-symbol", symbol)
    tile.setAttribute("data-index", index)
    tile.innerText = ""

    // Cross-browser event handling
    if (tile.addEventListener) {
      // Modern browsers
      tile.addEventListener("click", function (e) {
        e.preventDefault()
        handleTileClick(this)
      })

      // Add touch support
      tile.addEventListener("touchstart", function (e) {
        e.preventDefault()
        this.style.transform = "scale(0.95)"
        this.style.webkitTransform = "scale(0.95)"
      })

      tile.addEventListener("touchend", function (e) {
        e.preventDefault()
        this.style.transform = ""
        this.style.webkitTransform = ""
        handleTileClick(this)
      })
    } else if (tile.attachEvent) {
      // IE8 and below
      tile.attachEvent("onclick", () => {
        handleTileClick(tile)
      })
    }

    gameBoard.appendChild(tile)
  })

  startCountdown()

  // Handle background music with proper sound state checking
  const backgroundMusic = document.getElementById("backgroundMusic")
  if (backgroundMusic && soundEnabled) {
    try {
      backgroundMusic.currentTime = 0
      const playPromise = backgroundMusic.play()

      // Handle browsers that don't return a promise
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log("Could not play background music: ", error)
        })
      }
      backgroundMusic.loop = true
    } catch (e) {
      console.log("Could not play background music")
    }
  }
}

function startCountdown() {
  clearInterval(gameTimer)

  gameTimer = setInterval(() => {
    timeRemaining--
    const timerText = document.getElementById("timerText")
    const timerContainer = document.getElementById("timerContainer")
    timerText.innerText = timeRemaining

    if (timeRemaining <= 10) {
      timerContainer.classList.add("timer-warning")

      if (timeRemaining <= 5) {
        const tickSound = document.getElementById("tickSound")
        if (tickSound && soundEnabled) {
          try {
            tickSound.currentTime = 0
            tickSound.play().catch((e) => {
              console.log("Could not play tick sound")
            })
          } catch (e) {
            console.log("Could not play tick sound")
          }
        }
      }
    }

    if (timeRemaining <= 0) {
      clearInterval(gameTimer)
      endGame(false)
    }
  }, 1000)
}

function endGame(won) {
  clearInterval(gameTimer)
  document.getElementById("timerContainer").style.display = "none"
  document.getElementById("progressContainer").style.display = "none"

  const backgroundMusic = document.getElementById("backgroundMusic")
  if (backgroundMusic) {
    backgroundMusic.pause()
    try {
      backgroundMusic.currentTime = 0
    } catch (e) {
      // Some browsers don't support setting currentTime
    }
  }

  if (won) {
    celebrateWin()
  } else {
    const timeoutSound = document.getElementById("timeoutSound")
    if (timeoutSound && soundEnabled) {
      try {
        timeoutSound.currentTime = 0
        timeoutSound.play().catch((e) => {
          console.log("Could not play timeout sound")
        })
      } catch (e) {
        console.log("Could not play timeout sound")
      }
    }

    document.getElementById("gameBoard").style.display = "none"

    const instructionsBox = document.getElementById("instructionsBox")
    instructionsBox.style.display = "block"
    instructionsBox.style.opacity = "1"
    instructionsBox.innerHTML = `
      <div class="instruction-content">
        <h2 style="color: #d32f2f;">Time's Up!</h2>
        <p>You ran out of time. Would you like to try again?</p>
        <div style="display: flex; gap: 15px; justify-content: center; margin-top: 20px;">
          <button class="start-button" onclick="startGame()">
            <span class="button-icon">🔄</span>
            Try Again
          </button>
          <button class="action-button secondary" onclick="resetToMenu()">
            Back to Menu
          </button>
        </div>
      </div>
    `
  }
}

function handleTileClick(tile) {
  if (!canClick || tile.innerText !== "" || tile.classList.contains("matched")) return

  // Prevent default for event if it exists
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }

  const clickSound = document.getElementById("clickSound")
  if (clickSound && soundEnabled) {
    try {
      clickSound.currentTime = 0
      clickSound.play().catch((e) => {
        console.log("Could not play click sound")
      })
    } catch (e) {
      console.log("Could not play click sound")
    }
  }

  tile.innerText = tile.getAttribute("data-symbol")

  // Cross-browser class manipulation
  if (tile.classList) {
    tile.classList.add("flipped")
  } else {
    tile.className += " flipped"
  }

  if (!firstTile) {
    firstTile = tile
  } else {
    canClick = false
    if (firstTile.getAttribute("data-symbol") === tile.getAttribute("data-symbol") && firstTile !== tile) {
      const matchSound = document.getElementById("matchSound")
      if (matchSound && soundEnabled) {
        try {
          matchSound.currentTime = 0
          matchSound.play().catch((e) => {
            console.log("Could not play match sound")
          })
        } catch (e) {
          console.log("Could not play match sound")
        }
      }

      setTimeout(() => {
        // Cross-browser class manipulation
        if (tile.classList) {
          firstTile.classList.add("matched")
          tile.classList.add("matched")
          firstTile.classList.remove("flipped")
          tile.classList.remove("flipped")
        } else {
          firstTile.className = firstTile.className.replace("flipped", "matched")
          tile.className = tile.className.replace("flipped", "matched")
        }

        matchedPairs++
        updateProgress()

        firstTile = null
        canClick = true
        checkWin()
      }, 500)
    } else {
      setTimeout(() => {
        tile.innerText = ""
        firstTile.innerText = ""

        // Cross-browser class manipulation
        if (tile.classList) {
          tile.classList.remove("flipped")
          firstTile.classList.remove("flipped")
        } else {
          tile.className = tile.className.replace(" flipped", "")
          firstTile.className = firstTile.className.replace(" flipped", "")
        }

        firstTile = null
        canClick = true
      }, 1000)
    }
  }
}

function checkWin() {
  if (matchedPairs === symbols.length) {
    clearInterval(gameTimer)
    document.getElementById("timerContainer").style.display = "none"
    document.getElementById("progressContainer").style.display = "none"
    celebrateWin()
  }
}

function celebrateWin() {
  document.getElementById("gameBoard").style.display = "none"
  document.getElementById("instructionsBox").style.opacity = "0"

  const backgroundMusic = document.getElementById("backgroundMusic")
  if (backgroundMusic) {
    backgroundMusic.pause()
    try {
      backgroundMusic.currentTime = 0
    } catch (e) {
      // Some browsers don't support setting currentTime
    }
  }

  document.getElementById("envelopeContainer").style.display = "block"

  const winSound = document.getElementById("winSound")
  if (winSound && soundEnabled) {
    try {
      winSound.currentTime = 0
      winSound.play().catch((e) => {
        console.log("Could not play win sound")
      })
    } catch (e) {
      console.log("Could not play win sound")
    }
  }

  createConfetti()

  setTimeout(() => {
    const envelopeFlap = document.getElementById("envelopeFlap")

    // Cross-browser class manipulation
    if (envelopeFlap.classList) {
      envelopeFlap.classList.add("open")
    } else {
      envelopeFlap.className += " open"
    }

    const envelopeSound = document.getElementById("envelopeSound")
    if (envelopeSound && soundEnabled) {
      try {
        envelopeSound.currentTime = 0
        envelopeSound.play().catch((e) => {
          console.log("Could not play envelope sound")
        })
      } catch (e) {
        console.log("Could not play envelope sound")
      }
    }

    setTimeout(() => {
      const envelopeLetter = document.getElementById("envelopeLetter")

      // Cross-browser class manipulation
      if (envelopeLetter.classList) {
        envelopeLetter.classList.add("reveal")
      } else {
        envelopeLetter.className += " reveal"
      }

      setTimeout(() => {
        const messageContent = document.getElementById("messageContent")

        // Cross-browser class manipulation
        if (messageContent.classList) {
          messageContent.classList.add("show")
        } else {
          messageContent.className += " show"
        }

        setTimeout(() => {
          const actionButtons = document.getElementById("actionButtons")

          // Cross-browser class manipulation
          if (actionButtons.classList) {
            actionButtons.classList.add("show")
          } else {
            actionButtons.className += " show"
          }
        }, 800)
      }, 500)
    }, 1000)
  }, 500)
}

function createConfetti() {
  const confettiWrapper = document.getElementById("confettiWrapper")
  const colors = ["#ff8563", "#ffce47", "#a5dd9b", "#60c1e8", "#f588eb"]

  // Check if Web Animations API is supported
  const supportsAnimations = "animate" in document.createElement("div")

  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement("div")
    confetti.style.position = "absolute"
    confetti.style.width = Math.random() * 10 + 5 + "px"
    confetti.style.height = Math.random() * 10 + 5 + "px"
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
    confetti.style.left = Math.random() * 100 + "vw"
    confetti.style.top = -20 + "px"
    confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "0"
    confetti.style.opacity = Math.random() * 0.7 + 0.3
    confetti.style.zIndex = "1001"

    confettiWrapper.appendChild(confetti)

    const duration = Math.random() * 3 + 2
    const rotation = Math.random() * 360

    if (supportsAnimations) {
      // Modern browsers with Web Animations API
      try {
        confetti.animate(
          [
            { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
            { transform: `translateY(100vh) rotate(${rotation}deg)`, opacity: 0 },
          ],
          {
            duration: duration * 1000,
            easing: "cubic-bezier(0.17, 0.67, 0.83, 0.67)",
            fill: "forwards",
          },
        )
      } catch (e) {
        // Fallback for browsers that support animate() but have issues
        fallbackAnimation(confetti, duration, rotation)
      }
    } else {
      // Fallback for older browsers
      fallbackAnimation(confetti, duration, rotation)
    }

    // Remove confetti element after animation
    setTimeout(() => {
      if (confetti.parentNode) {
        confetti.parentNode.removeChild(confetti)
      }
    }, duration * 1000)
  }
}

function fallbackAnimation(element, duration, rotation) {
  // CSS-based fallback animation
  element.style.transition = `transform ${duration}s cubic-bezier(0.17, 0.67, 0.83, 0.67), opacity ${duration}s cubic-bezier(0.17, 0.67, 0.83, 0.67)`

  // Use setTimeout to ensure the initial state is rendered before changing
  setTimeout(() => {
    element.style.transform = `translateY(100vh) rotate(${rotation}deg)`
    element.style.opacity = "0"
  }, 10)
}

// Utility function to shuffle array
function shuffleArray(arr) {
  const newArr = arr.slice()
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArr[i], newArr[j]] = [newArr[j], newArr[i]]
  }
  return newArr
}
