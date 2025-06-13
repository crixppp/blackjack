import { createDeck, calculateValue } from './cards.js';

let deck, playerHand, dealerHand;
let hasSplit = false;
let splitHand = null;
let isSplitTurn = false;

const root = document.getElementById('root');

function initialiseGame() {
  const modal = document.getElementById('modal');
  if (modal) modal.classList.remove('show');

  deck = createDeck();
  playerHand = [deck.pop(), deck.pop()];
  dealerHand = [deck.pop(), deck.pop()];
  hasSplit = false;
  splitHand = null;
  isSplitTurn = false;
  renderGame();
}

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
};

window.stand = function () {
  if (hasSplit && !isSplitTurn) {
    isSplitTurn = true;
    renderGame();
    return;
  }

  while (calculateValue(dealerHand) < 17) dealerHand.push(deck.pop());
  endGame();
};

window.doubleDown = function () {
  if (isSplitTurn) splitHand.push(deck.pop());
  else playerHand.push(deck.pop());

  window.stand();
};

window.split = function () {
  hasSplit = true;
  splitHand = [playerHand.pop()];
  playerHand.push(deck.pop());
  splitHand.push(deck.pop());
  renderGame();
};

function checkForBust() {
  const activeHand = isSplitTurn ? splitHand : playerHand;
  if (calculateValue(activeHand) > 21) window.stand();
}

function canSplit() {
  return playerHand.length === 2 && playerHand[0].value === playerHand[1].value;
}

function endGame() {
  const playerVal = calculateValue(playerHand);
  const dealerVal = calculateValue(dealerHand);
  const splitVal = hasSplit ? calculateValue(splitHand) : null;

  let message = `Dealer: ${dealerVal}<br>You: ${playerVal} — ${outcome(playerVal, dealerVal)}`;
  if (hasSplit) {
    message += `<br>Split Hand: ${splitVal} — ${outcome(splitVal, dealerVal)}`;
  }

  showModal(message);
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
  text.innerHTML = message;
  modal.classList.add('show');
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

// Start game
initialiseGame();
