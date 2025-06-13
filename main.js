// main.js
import { createDeck, calculateValue } from './cards.js';

let deck, playerHand, dealerHand;
let hasSplit = false;
let splitHand = null;
let isSplitTurn = false;

const root = document.getElementById('root');

function initialiseGame() {
  deck = createDeck();
  playerHand = [deck.pop(), deck.pop()];
  dealerHand = [deck.pop(), deck.pop()];
  hasSplit = false;
  splitHand = null;
  isSplitTurn = false;
  renderGame();
}

function renderGame() {
  root.innerHTML = `
    <h1>Blackjack</h1>
    <div><strong>Dealer:</strong> ${renderCards(dealerHand, true)}</div>
    <div><strong>You:</strong> ${renderCards(playerHand)}</div>
    ${hasSplit ? `<div><strong>Split Hand:</strong> ${renderCards(splitHand)}</div>` : ''}
    <div class="card-container">
      <button onclick="hit()">Hit</button>
      <button onclick="stand()">Stand</button>
      <button onclick="doubleDown()">Double</button>
      ${canSplit() && !hasSplit ? '<button onclick="split()">Split</button>' : ''}
    </div>
  `;
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

  let message = `Dealer: ${dealerVal}\nYou: ${playerVal} — ` + outcome(playerVal, dealerVal);
  if (hasSplit) {
    message += `\nSplit Hand: ${splitVal} — ` + outcome(splitVal, dealerVal);
  }

  alert(message);
  initialiseGame();
}

function outcome(player, dealer) {
  if (player > 21) return 'Bust!';
  if (dealer > 21 || player > dealer) return 'Win!';
  if (player < dealer) return 'Lose!';
  return 'Push.';
}

// Start game
initialiseGame();
