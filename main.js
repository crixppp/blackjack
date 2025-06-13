import { createDeck, calculateValue } from './cards.js';

let deck, playerHand, dealerHand;
let hasSplit = false;
let splitHand = null;
let isSplitTurn = false;

let coinBalance = parseInt(localStorage.getItem('coinBalance')) || 50000;
let currentBet = 0;

const root = document.getElementById('root');
const coinDisplay = document.getElementById('coin-balance');
const betDisplay = document.getElementById('current-bet');

// Placeholder sound effects
const sounds = {
  click: new Audio('click.mp3'),         // Button click
  win: new Audio('win.mp3'),             // Win sound
  lose: new Audio('lose.mp3'),           // Lose sound
  blackjack: new Audio('blackjack.mp3')  // Blackjack!
};

function updateDisplay() {
  coinDisplay.textContent = coinBalance;
  coinDisplay.classList.add('coin-flash');
  setTimeout(() => coinDisplay.classList.remove('coin-flash'), 400);
  betDisplay.textContent = currentBet;
  toggleGameButtons(currentBet > 0);
  localStorage.setItem('coinBalance', coinBalance);
}

function toggleGameButtons(enabled) {
  document.querySelectorAll('.buttons button').forEach(btn => {
    btn.disabled = !enabled;
  });
}

function initialiseGame() {
  if (currentBet === 0) {
    alert('Please place a bet before starting.');
    return;
  }

  const modal = document.getElementById('modal');
  if (modal) modal.classList.remove('show');

  deck = createDeck();
  playerHand = [deck.pop(), deck.pop()];
  dealerHand = [deck.pop(), deck.pop()];
  hasSplit = false;
  splitHand = null;
  isSplitTurn = false;

  updateDisplay();
  renderGame();
  checkForBlackjack();
}

window.placeBet = function (amount) {
  if (deck && playerHand && playerHand.length > 0) return;

  if (amount === 'max') {
    currentBet = Math.min(5000, coinBalance);
  } else if (coinBalance >= amount) {
    currentBet = amount;
  } else {
    alert('Not enough coins!');
    return;
  }

  coinBalance -= currentBet;
  updateDisplay();
  sounds.click.play();
  initialiseGame();
};

function renderGame() {
  const dealerTotal = calculateValue(dealerHand);
  const playerTotal = calculateValue(playerHand);
  const splitTotal = hasSplit ? calculateValue(splitHand) : 0;

  root.innerHTML = `
    <h1>Blackjack</h1>

    <div class="hand-section">
      <div class="label">Dealer ${isSplitTurn || !hasSplit ? `(${dealerTotal})` : ''}:</div>
      <div class="card-container dealer">${renderCards(dealerHand, !(isSplitTurn || !hasSplit))}</div>
    </div>

    ${hasSplit ? `
      <div class="hand-section">
        <div class="label">Split Hand (${splitTotal}):</div>
        <div class="card-container split">${renderCards(splitHand)}</div>
      </div>
    ` : ''}

    <div class="hand-section">
      <div class="label">You (${playerTotal}):</div>
      <div class="card-container player">${renderCards(playerHand)}</div>
    </div>

    <div class="card-container buttons">
      <button onclick="hit()">Hit</button>
      <button onclick="stand()">Stand</button>
      <button onclick="doubleDown()">Double</button>
      ${canSplit() && !hasSplit ? '<button onclick="split()">Split</button>' : ''}
    </div>
  `;

  toggleGameButtons(currentBet > 0);
  animateCards();
}

function renderCards(hand, hideFirst = false) {
  return hand
    .map((card, i) =>
      hideFirst && i === 0 ? '<span class="card">??</span>' :
      `<span class="card">${card.value}${card.suit}</span>`
    )
    .join('');
}

window.hit = function () {
  if (isSplitTurn) splitHand.push(deck.pop());
  else playerHand.push(deck.pop());

  checkForBust();
  renderGame();
  checkForBlackjack();
};

window.stand = function () {
  if (hasSplit && !isSplitTurn) {
    isSplitTurn = true;
    renderGame();
    return;
  }

  animateDealerDraw();
};

window.doubleDown = function () {
  if (coinBalance >= currentBet) {
    coinBalance -= currentBet;
    currentBet *= 2;
    updateDisplay();
    if (isSplitTurn) splitHand.push(deck.pop());
    else playerHand.push(deck.pop());
    window.stand();
  } else {
    alert('Not enough coins to double down!');
  }
};

window.split = function () {
  hasSplit = true;
  splitHand = [playerHand.pop()];
  playerHand.push(deck.pop());
  splitHand.push(deck.pop());
  renderGame();
  checkForBlackjack();
};

function checkForBust() {
  const activeHand = isSplitTurn ? splitHand : playerHand;
  if (calculateValue(activeHand) > 21) window.stand();
}

function checkForBlackjack() {
  const playerVal = calculateValue(playerHand);
  const dealerVal = calculateValue(dealerHand);

  if (playerVal === 21 && dealerVal === 21) {
    setTimeout(() => endGame(), 500);
    return true;
  }

  if (playerVal === 21) {
    sounds.blackjack.play();
    setTimeout(() => showModal(`Blackjack!<br>You: 21 — Win!`), 500);
    return true;
  }

  if (dealerVal === 21) {
    sounds.lose.play();
    setTimeout(() => showModal(`Dealer has Blackjack!<br>Dealer: 21 — Lose!`), 500);
    return true;
  }

  return false;
}

function canSplit() {
  return playerHand.length === 2 && playerHand[0].value === playerHand[1].value;
}

function endGame() {
  const playerVal = calculateValue(playerHand);
  const dealerVal = calculateValue(dealerHand);
  const splitVal = hasSplit ? calculateValue(splitHand) : null;

  let winnings = 0;
  let message = `Dealer: ${dealerVal}<br>You: ${playerVal} — ${outcome(playerVal, dealerVal)}`;

  const result = outcome(playerVal, dealerVal);
  if (result === 'Win!') {
    winnings += currentBet * 2;
    sounds.win.play();
  }
  if (result === 'Push.') winnings += currentBet;
  if (result === 'Lose!') sounds.lose.play();

  if (hasSplit) {
    const splitResult = outcome(splitVal, dealerVal);
    message += `<br>Split Hand: ${splitVal} — ${splitResult}`;
    if (splitResult === 'Win!') winnings += currentBet * 2;
    if (splitResult === 'Push.') winnings += currentBet;
  }

  coinBalance += winnings;
  currentBet = 0;
  updateDisplay();

  setTimeout(() => showModal(message), 1000);
}

function outcome(player, dealer) {
  if (player > 21) return 'Bust!';
  if (dealer > 21 || player > dealer) return 'Win!';
  if (player < dealer) return 'Lose!';
  return 'Push.';
}

function showModal(message) {
  const modal = document.getElementById('modal');
  const text = document.getElementById('modal-message');
  const playBtn = document.getElementById('play-again');

  text.innerHTML = message;
  modal.classList.add('show');

  playBtn.onclick = () => {
    modal.classList.remove('show');
    initialiseGame();
  };
}

function animateCards() {
  document.querySelectorAll('.card').forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, i * 80);
  });
}

function animateDealerDraw() {
  function draw() {
    if (calculateValue(dealerHand) < 17) {
      dealerHand.push(deck.pop());
      renderGame();
      setTimeout(draw, 600);
    } else {
      endGame();
    }
  }

  draw();
}

// Initialise UI
updateDisplay();
toggleGameButtons(false);
