const hasDocument = typeof document !== "undefined";
const gemGrid = hasDocument ? document.getElementById("gem-grid") : null;
const marketCards = hasDocument ? document.getElementById("market-cards") : null;
const playerList = hasDocument ? document.getElementById("player-list") : null;
const player1Slot = hasDocument ? document.getElementById("player-1-slot") : null;
const player2Slot = hasDocument ? document.getElementById("player-2-slot") : null;
const activityFeed = hasDocument ? document.getElementById("activity-feed") : null;
const draftCount = hasDocument ? document.getElementById("draft-count") : null;
const scrollOwner = hasDocument ? document.getElementById("scroll-owner") : null;
const turnPill = hasDocument ? document.getElementById("turn-pill") : null;
const statusCopy = hasDocument ? document.getElementById("status-copy") : null;
const intentCopy = hasDocument ? document.getElementById("intent-copy") : null;
const intentDetail = hasDocument ? document.getElementById("intent-detail") : null;
const claimScrollButton = hasDocument ? document.getElementById("claim-scroll") : null;
const spectatorState = hasDocument ? document.getElementById("spectator-state") : null;
const spectatorHint = hasDocument ? document.getElementById("spectator-hint") : null;
const startSpectatorButton = hasDocument ? document.getElementById("start-spectator") : null;
const stopSpectatorButton = hasDocument ? document.getElementById("stop-spectator") : null;
const restartSpectatorButton = hasDocument ? document.getElementById("restart-spectator") : null;
const rematchButton = hasDocument ? document.getElementById("rematch-match") : null;
const gameResultPill = hasDocument ? document.getElementById("game-result-pill") : null;
const gameResultCopy = hasDocument ? document.getElementById("game-result-copy") : null;
const matchModeSelect = hasDocument ? document.getElementById("match-mode") : null;
const modeHint = hasDocument ? document.getElementById("mode-hint") : null;
const actionChips = hasDocument ? Array.from(document.querySelectorAll(".action-chip")) : [];
const appPage = hasDocument ? document.body.dataset.page || "main" : "main";

const SPECTATOR_DELAY_MS = 1000;
const VICTORY_TARGET_POINTS = 6;
const SAVE_VERSION = 1;
const SAVE_STORAGE_KEY = "splendor-dual-pretzel:match-state:v1";

const boardPalette = [
  "ruby",
  "sapphire",
  "emerald",
  "pearl",
  "onyx",
  "emerald",
  "ruby",
  "pearl",
  "sapphire",
  "onyx",
  "ruby",
  "emerald",
  "sapphire",
  "pearl",
  "onyx"
];

const marketTemplate = [
  { id: "c01", title: "Sunforge Atelier", points: 2, bonusLabel: "Ruby", bonusColor: "ruby", cost: ["ruby", "emerald", "pearl"] },
  { id: "c02", title: "Sea Glass Hall", points: 1, bonusLabel: "Sapphire", bonusColor: "sapphire", cost: ["sapphire", "sapphire", "onyx"] },
  { id: "c03", title: "Gilded Grove", points: 3, bonusLabel: "Emerald", bonusColor: "emerald", cost: ["emerald", "pearl", "onyx"] },
  { id: "c04", title: "Obsidian Vault", points: 2, bonusLabel: "Onyx", bonusColor: "onyx", cost: ["onyx", "onyx", "ruby"] },
  { id: "c05", title: "Pearl Sanctum", points: 1, bonusLabel: "Pearl", bonusColor: "pearl", cost: ["pearl", "ruby"] },
  { id: "c06", title: "Ruby Spire", points: 3, bonusLabel: "Ruby", bonusColor: "ruby", cost: ["ruby", "ruby", "sapphire", "onyx"] },
  { id: "c07", title: "Tidal Forge", points: 1, bonusLabel: "Sapphire", bonusColor: "sapphire", cost: ["sapphire", "emerald"] },
  { id: "c08", title: "Emerald Bastion", points: 2, bonusLabel: "Emerald", bonusColor: "emerald", cost: ["emerald", "emerald", "sapphire"] },
  { id: "c09", title: "Onyx Citadel", points: 4, bonusLabel: "Onyx", bonusColor: "onyx", cost: ["onyx", "onyx", "pearl", "ruby"] },
  { id: "c10", title: "Moonstone Keep", points: 2, bonusLabel: "Pearl", bonusColor: "pearl", cost: ["pearl", "pearl", "emerald"] },
  { id: "c11", title: "Crimson Market", points: 1, bonusLabel: "Ruby", bonusColor: "ruby", cost: ["ruby", "onyx"] },
  { id: "c12", title: "Azure Pavilion", points: 3, bonusLabel: "Sapphire", bonusColor: "sapphire", cost: ["sapphire", "sapphire", "ruby", "pearl"] }
];

const BOARD_COLS = 5;

function gemPosition(index) {
  return { row: Math.floor(index / BOARD_COLS), col: index % BOARD_COLS };
}

function areCollinearAndAdjacent(indices) {
  if (indices.length <= 1) return true;
  const positions = indices.map(gemPosition);
  positions.sort((a, b) => a.row - b.row || a.col - b.col);
  
  // Check if all positions are collinear (same direction)
  const dr = positions[1].row - positions[0].row;
  const dc = positions[1].col - positions[0].col;
  
  for (let i = 2; i < positions.length; i++) {
    const currentDr = positions[i].row - positions[i - 1].row;
    const currentDc = positions[i].col - positions[i - 1].col;
    if (currentDr !== dr || currentDc !== dc) return false;
  }
  
  // Gems must be collinear but don't need to be adjacent
  // This allows horizontal, vertical, and diagonal lines
  return true;
}

function canAddToLine(existingIndices, newIndex) {
  return areCollinearAndAdjacent([...existingIndices, newIndex]);
}

const intentMap = {
  draft: {
    title: "Draft Gems",
    detail: "Take up to 3 different-colored gems per turn."
  },
  reserve: {
    title: "Reserve Card",
    detail: "Reserve one market card for later."
  },
  buy: {
    title: "Buy Card",
    detail: "Buy a card using tokens plus bonuses."
  },
  scroll: {
    title: "Claim Scroll",
    detail: "Claim a privilege scroll."
  }
};

const intentStatusMap = {
  draft: "Draft up to 3 gems, then end turn.",
  reserve: "Reserve a card for later.",
  buy: "Buy a card you can afford.",
  scroll: "Claim a scroll, then end turn."
};

function hasLocalStorageSupport() {
  if (!hasDocument || typeof window === "undefined") {
    return false;
  }

  try {
    return Boolean(window.localStorage);
  } catch (error) {
    return false;
  }
}

function normalizeUiState(ui = {}) {
  return {
    action: intentMap[ui.action] ? ui.action : "draft",
    feedback: typeof ui.feedback === "string" ? ui.feedback : "",
    spectatorRunning: false,
    matchMode: ui.matchMode === "hvc" ? "hvc" : "hvh"
  };
}

function isValidSavedMatchShape(match) {
  return Boolean(
    match &&
      typeof match === "object" &&
      Array.isArray(match.board) &&
      Array.isArray(match.market) &&
      Array.isArray(match.players) &&
      Array.isArray(match.log) &&
      typeof match.turn === "number" &&
      typeof match.activePlayer === "number" &&
      match.players.length >= 2
  );
}

function loadPersistedSnapshot() {
  if (!hasLocalStorageSupport()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== SAVE_VERSION || !isValidSavedMatchShape(parsed.match)) {
      return null;
    }

    return {
      match: parsed.match,
      ui: normalizeUiState(parsed.ui)
    };
  } catch (error) {
    return null;
  }
}

function persistSnapshot() {
  if (!hasLocalStorageSupport()) {
    return;
  }

  try {
    const payload = {
      version: SAVE_VERSION,
      updatedAt: Date.now(),
      match: state.match,
      ui: normalizeUiState(state.ui)
    };
    window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    // Ignore persistence errors to keep gameplay uninterrupted.
  }
}

function createBoardState() {
  return boardPalette.map((gem, index) => ({ id: `gem-${index}`, gem, spent: false }));
}

function createPlayer(id, name, title) {
  return {
    id,
    name,
    title,
    points: 0,
    scrolls: 0,
    tokens: { ruby: 0, sapphire: 0, emerald: 0, pearl: 0, onyx: 0 },
    bonuses: { ruby: 0, sapphire: 0, emerald: 0, pearl: 0, onyx: 0 },
    reservedCards: [],
    purchasedCards: []
  };
}

function createInitialMatch() {
  return {
    activePlayer: 0,
    turn: 1,
    turnActionTaken: false,
    draftSelection: [],
    board: createBoardState(),
    market: marketTemplate.map((card) => ({ ...card })),
    players: [
      createPlayer("player-1", "Player One", "Golden Architect"),
      createPlayer("player-2", "Player Two", "Velvet Merchant")
    ],
    scrollOwner: null,
    gameOver: null,
    log: [
      "Match ready.",
      "Choose an action, then commit it."
    ]
  };
}

const state = {
  match: createInitialMatch(),
  ui: {
    action: "draft",
    feedback: "",
    spectatorRunning: false,
    matchMode: "hvh"
  }
};

let spectatorTimer = null;
let computerTurnTimer = null;

function getActivePlayer(match = state.match) {
  return match.players[match.activePlayer];
}

function isComputerControlledIndex(index) {
  return appPage === "spectator" || (state.ui.matchMode === "hvc" && index === 1);
}

function isComputerTurn(match = state.match) {
  return isComputerControlledIndex(match.activePlayer);
}

function isAutomationAction(action) {
  return Boolean(action && action.meta && (action.meta.source === "spectator" || action.meta.source === "computer"));
}

function getColorCounts(colors) {
  return colors.reduce((acc, color) => {
    acc[color] = (acc[color] || 0) + 1;
    return acc;
  }, {});
}

function canAffordCard(player, card) {
  const requiredByColor = getColorCounts(card.cost);
  return Object.entries(requiredByColor).every(([color, required]) => {
    const discount = player.bonuses[color] || 0;
    const payable = Math.max(required - discount, 0);
    return (player.tokens[color] || 0) >= payable;
  });
}

function getShortfall(player, card) {
  const requiredByColor = getColorCounts(card.cost);
  const missing = [];
  Object.entries(requiredByColor).forEach(([color, required]) => {
    const discount = player.bonuses[color] || 0;
    const payable = Math.max(required - discount, 0);
    const short = payable - (player.tokens[color] || 0);
    if (short > 0) missing.push(`${short} ${color}`);
  });
  return missing;
}

function cloneMatch(match) {
  return JSON.parse(JSON.stringify(match));
}

function pushLog(match, message) {
  match.log.unshift(message);
  match.log = match.log.slice(0, 16);
}

function invalidResult(message, match = state.match) {
  return {
    ok: false,
    feedback: message,
    match
  };
}

function actorLabel(action, activePlayer) {
  if (action.meta && action.meta.source === "spectator") {
    return `[AUTO] ${activePlayer.name}`;
  }
  return activePlayer.name;
}

function applyPayment(player, card) {
  const requiredByColor = getColorCounts(card.cost);
  Object.entries(requiredByColor).forEach(([color, required]) => {
    const discount = player.bonuses[color] || 0;
    const payable = Math.max(required - discount, 0);
    player.tokens[color] -= payable;
  });
}

function collectWinnerCandidates(match) {
  const pointLeaders = match.players
    .filter((player) => player.points >= VICTORY_TARGET_POINTS)
    .sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }

      if (b.scrolls !== a.scrolls) {
        return b.scrolls - a.scrolls;
      }

      const aBonuses = Object.values(a.bonuses).reduce((sum, value) => sum + value, 0);
      const bBonuses = Object.values(b.bonuses).reduce((sum, value) => sum + value, 0);
      if (bBonuses !== aBonuses) {
        return bBonuses - aBonuses;
      }

      return a.name.localeCompare(b.name);
    });

  if (pointLeaders.length > 0) {
    return {
      winner: pointLeaders[0],
      reason: `Reached ${VICTORY_TARGET_POINTS} points.`,
      summary: `${pointLeaders[0].name} won by points.`
    };
  }

  const hasReservedCards = match.players.some((player) => player.reservedCards.length > 0);
  if (match.market.length === 0 && !hasReservedCards) {
    const marketLeaders = [...match.players].sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      if (b.scrolls !== a.scrolls) {
        return b.scrolls - a.scrolls;
      }
      return a.name.localeCompare(b.name);
    });

    return {
      winner: marketLeaders[0],
      reason: "Market exhausted with no reserved cards remaining.",
      summary: `${marketLeaders[0].name} won on market exhaustion.`
    };
  }

  return null;
}

function finalizeEndgameIfNeeded(match, actor) {
  const outcome = collectWinnerCandidates(match);
  if (!outcome) {
    return null;
  }

  match.gameOver = {
    winnerId: outcome.winner.id,
    winnerName: outcome.winner.name,
    reason: outcome.reason
  };
  pushLog(match, `${actor} triggered endgame. ${outcome.summary} ${outcome.reason}`);
  return match.gameOver;
}

function applyTransition(action) {
  const nextMatch = cloneMatch(state.match);
  const activePlayer = getActivePlayer(nextMatch);
  const actor = actorLabel(action, activePlayer);
  const bypassUiGate = Boolean(action.meta && action.meta.ignoreUiGate);

  if (nextMatch.gameOver && action.type !== "RESET_MATCH") {
    return invalidResult("Match over. Start a new match to continue.", nextMatch);
  }

  switch (action.type) {
    case "RESET_MATCH": {
      const resetMatch = createInitialMatch();
      return {
        ok: true,
        feedback: "",
        match: resetMatch,
        uiAction: "draft"
      };
    }

    case "SET_ACTION": {
      return {
        ok: true,
        feedback: "",
        match: nextMatch,
        uiAction: action.payload.action
      };
    }

    case "END_TURN": {
      nextMatch.draftSelection = [];
      nextMatch.turnActionTaken = false;
      const remainingGems = nextMatch.board.filter((c) => !c.spent).length;
      if (remainingGems <= 2) {
        nextMatch.board = createBoardState();
      }
      nextMatch.activePlayer = (nextMatch.activePlayer + 1) % nextMatch.players.length;
      if (nextMatch.activePlayer === 0) {
        nextMatch.turn += 1;
      }
      const nextPlayer = getActivePlayer(nextMatch);
      const gameOver = finalizeEndgameIfNeeded(nextMatch, actor);
      if (gameOver) {
        pushLog(nextMatch, `Match complete: ${gameOver.winnerName}. ${gameOver.reason}`);
      } else {
        pushLog(nextMatch, `${actor} ended the turn. ${nextPlayer.name} is now active for turn ${nextMatch.turn}.`);
      }
      return {
        ok: true,
        feedback: "",
        match: nextMatch,
        uiAction: "draft"
      };
    }

    case "TAKE_GEM": {
      if (!bypassUiGate && state.ui.action !== "draft") {
        return invalidResult("Switch to Draft Gems first.");
      }

      const cell = nextMatch.board[action.payload.index];
      if (!cell || cell.spent) {
        return invalidResult("That gem lane is unavailable.");
      }

      if (nextMatch.draftSelection.length >= 3) {
        return invalidResult("Draft full. End your turn.");
      }

      if (nextMatch.draftSelection.some((pick) => pick.gem === cell.gem)) {
        return invalidResult("Picks must be different colors.");
      }

      const existingIndices = nextMatch.draftSelection.map((pick) => nextMatch.board.findIndex((c) => c.id === pick.id));
      if (!canAddToLine(existingIndices, action.payload.index)) {
        return invalidResult("Gems must be in a straight line.");
      }

      cell.spent = true;
      nextMatch.draftSelection.push({ id: cell.id, gem: cell.gem });
      activePlayer.tokens[cell.gem] += 1;
      pushLog(nextMatch, `${actor} drafted one ${cell.gem} gem.`);
      return {
        ok: true,
        feedback: "",
        match: nextMatch
      };
    }

    case "RESERVE_CARD": {
      if (!bypassUiGate && state.ui.action !== "reserve") {
        return invalidResult("Switch to Reserve Card first.");
      }

      const marketIndex = nextMatch.market.findIndex((card) => card.id === action.payload.cardId);
      if (marketIndex === -1) {
        return invalidResult("Card no longer available.");
      }

      const [card] = nextMatch.market.splice(marketIndex, 1);
      activePlayer.reservedCards.push(card);
      nextMatch.turnActionTaken = true;
      pushLog(nextMatch, `${actor} reserved ${card.title}.`);
      return {
        ok: true,
        feedback: "",
        match: nextMatch
      };
    }

    case "BUY_CARD": {
      if (!bypassUiGate && state.ui.action !== "buy") {
        return invalidResult("Switch to Buy Card first.");
      }

      const marketIndex = nextMatch.market.findIndex((card) => card.id === action.payload.cardId);
      if (marketIndex === -1) {
        return invalidResult("Card no longer available.");
      }

      const card = nextMatch.market[marketIndex];
      if (!canAffordCard(activePlayer, card)) {
        const need = getShortfall(activePlayer, card);
        return invalidResult(`Need ${need.join(", ")} more.`);
      }

      applyPayment(activePlayer, card);
      activePlayer.points += card.points;
      activePlayer.bonuses[card.bonusColor] += 1;
      activePlayer.purchasedCards.push(card);
      nextMatch.market.splice(marketIndex, 1);

      nextMatch.turnActionTaken = true;
      pushLog(nextMatch, `${actor} bought ${card.title} from the market for ${card.points} points.`);
      return {
        ok: true,
        feedback: "",
        match: nextMatch
      };
    }

    case "BUY_RESERVED_CARD": {
      if (!bypassUiGate && state.ui.action !== "buy") {
        return invalidResult("Switch to Buy Card first.");
      }

      if (action.payload.playerId !== activePlayer.id) {
        return invalidResult("Only the active player can buy their reserves.");
      }

      const reservedIndex = activePlayer.reservedCards.findIndex((card) => card.id === action.payload.cardId);
      if (reservedIndex === -1) {
        return invalidResult("Reserved card no longer available.");
      }

      const card = activePlayer.reservedCards[reservedIndex];
      if (!canAffordCard(activePlayer, card)) {
        const need = getShortfall(activePlayer, card);
        return invalidResult(`Need ${need.join(", ")} more.`);
      }

      applyPayment(activePlayer, card);
      activePlayer.points += card.points;
      activePlayer.bonuses[card.bonusColor] += 1;
      activePlayer.purchasedCards.push(card);
      activePlayer.reservedCards.splice(reservedIndex, 1);

      nextMatch.turnActionTaken = true;
      pushLog(nextMatch, `${actor} bought reserved card ${card.title} for ${card.points} points.`);
      return {
        ok: true,
        feedback: "",
        match: nextMatch
      };
    }

    case "CLAIM_SCROLL": {
      if (!bypassUiGate && state.ui.action !== "scroll") {
        return invalidResult("Switch to Claim Scroll first.");
      }

      activePlayer.scrolls += 1;
      nextMatch.scrollOwner = activePlayer.name;
      pushLog(nextMatch, `${actor} claimed the privilege scroll.`);
      return {
        ok: true,
        feedback: "",
        match: nextMatch
      };
    }

    default:
      return invalidResult("Unknown action.");
  }
}

function dispatch(action) {
  if (isComputerTurn() && action.type !== "RESET_MATCH" && !isAutomationAction(action)) {
    state.ui.feedback = "Computer's turn. Please wait.";
    renderStatus();
    return { ok: false, feedback: state.ui.feedback, match: state.match };
  }

  const result = applyTransition(action);
  if (result.ok) {
    state.match = result.match;
    state.ui.feedback = result.feedback;
    if (result.uiAction) {
      state.ui.action = result.uiAction;
    }
    persistSnapshot();
  } else {
    state.ui.feedback = result.feedback;
  }

  if (state.match.gameOver && state.ui.spectatorRunning) {
    stopSpectator("[AUTO] Spectator stopped because the match ended.");
  }

  syncActionChips();
  syncSpectatorControls();
  render();
  if (result.ok && !isAutomationAction(action)) {
    scheduleComputerTurnIfNeeded();
  }

  return result;
}

function syncActionChips() {
  const matchEnded = Boolean(state.match.gameOver);
  const computerTurn = isComputerTurn();
  actionChips.forEach((chip) => {
    chip.classList.toggle("is-active", chip.dataset.action === state.ui.action);
    chip.disabled = matchEnded || computerTurn;
  });

  if (claimScrollButton) {
    claimScrollButton.disabled = state.ui.action !== "scroll" || matchEnded || computerTurn;
  }

  if (rematchButton) {
    rematchButton.disabled = !matchEnded;
  }

  if (matchModeSelect) {
    matchModeSelect.value = state.ui.matchMode;
    matchModeSelect.disabled = appPage === "spectator" || state.ui.spectatorRunning || matchEnded;
  }

  if (modeHint) {
    modeHint.textContent =
      state.ui.matchMode === "hvc"
        ? "Player One is human. Player Two plays automatically."
        : "Both players share this device.";
  }
}

function syncSpectatorControls() {
  if (!spectatorState || !spectatorHint || !startSpectatorButton || !stopSpectatorButton || !restartSpectatorButton) {
    return;
  }

  spectatorState.textContent = state.ui.spectatorRunning ? "Running" : "Stopped";
  spectatorHint.textContent = state.ui.spectatorRunning
    ? `Autoplay every ${SPECTATOR_DELAY_MS / 1000}s.`
    : "Start to watch automated play.";

  startSpectatorButton.disabled = state.ui.spectatorRunning || Boolean(state.match.gameOver);
  stopSpectatorButton.disabled = !state.ui.spectatorRunning;
  restartSpectatorButton.disabled = state.ui.spectatorRunning;
}

function setAction(action) {
  dispatch({ type: "SET_ACTION", payload: { action } });
}

function setMatchMode(mode) {
  state.ui.matchMode = mode === "hvc" ? "hvc" : "hvh";
  state.ui.feedback = state.ui.matchMode === "hvc" ? "Human vs Computer enabled." : "";
  stopComputerTurnLoop();
  persistSnapshot();
  syncActionChips();
  render();
  scheduleComputerTurnIfNeeded(150);
}

function resetMatch() {
  dispatch({ type: "RESET_MATCH" });
}

function endTurnWithMeta(meta = {}) {
  dispatch({ type: "END_TURN", meta });
}

function handleGemClickWithMeta(index, meta = {}) {
  dispatch({ type: "TAKE_GEM", payload: { index }, meta });
}

function endTurn() {
  endTurnWithMeta();
}

function handleGemClick(index) {
  handleGemClickWithMeta(index);
}

function handleCheat(playerId) {
  const player = state.match.players.find(p => p.id === playerId);
  if (!player) return;

  const gemTypes = ['ruby', 'sapphire', 'emerald', 'pearl', 'onyx'];
  const inputs = {};
  
  // Create input prompts for each gem type
  let promptText = 'Enter token amounts:\n';
  gemTypes.forEach(gem => {
    promptText += `${gem.charAt(0).toUpperCase() + gem.slice(1)}: `;
    const amount = prompt(promptText + `(current: ${player.tokens[gem]})`);
    if (amount !== null && !isNaN(amount) && parseInt(amount) >= 0) {
      inputs[gem] = parseInt(amount);
    } else {
      inputs[gem] = player.tokens[gem]; // Keep current if invalid
    }
    promptText = 'Enter token amounts:\n';
  });
  
  // Show confirmation
  const summary = gemTypes.map(gem => `${gem}: ${inputs[gem]}`).join(', ');
  const confirmed = confirm(`Gimme gimme these tokens?\n${summary}`);
  
  if (confirmed) {
    // Apply the cheat
    gemTypes.forEach(gem => {
      player.tokens[gem] = inputs[gem];
    });
    
    pushLog(state.match, `[CHEAT] ${player.name} adjusted tokens: ${summary}`);
    persistSnapshot();
    render();
  }
}

function handleCardAction(cardId, mode, meta = {}) {
  if (mode === "reserve") {
    dispatch({ type: "RESERVE_CARD", payload: { cardId }, meta });
    return;
  }

  state.ui.action = "buy";
  dispatch({ type: "BUY_CARD", payload: { cardId }, meta });
}

function handleReservedCardPurchase(playerId, cardId, meta = {}) {
  state.ui.action = "buy";
  dispatch({ type: "BUY_RESERVED_CARD", payload: { playerId, cardId }, meta });
}

function claimScroll(meta = {}) {
  dispatch({ type: "CLAIM_SCROLL", meta });
}

function getFirstAffordableMarketCard(match, player) {
  return match.market
    .filter((card) => canAffordCard(player, card))
    .sort((a, b) => b.points - a.points)[0];
}

function getFirstAffordableReservedCard(player) {
  return player.reservedCards
    .filter((card) => canAffordCard(player, card))
    .sort((a, b) => b.points - a.points)[0];
}

function getDraftGemIndex(match) {
  const takenColors = new Set(match.draftSelection.map((pick) => pick.gem));
  const existingIndices = match.draftSelection.map((pick) => match.board.findIndex((c) => c.id === pick.id));
  return match.board.findIndex((cell, index) => !cell.spent && !takenColors.has(cell.gem) && canAddToLine(existingIndices, index));
}

function nextSpectatorAction(match) {
  const activePlayer = getActivePlayer(match);
  const meta = { source: "spectator", ignoreUiGate: true };
  const hasDrafted = match.draftSelection.length > 0;
  const didBuyOrReserve = match.turnActionTaken;

  // If a buy/reserve action was already taken this turn, end turn
  if (didBuyOrReserve) {
    return { type: "END_TURN", meta };
  }

  // If we have 3 gems drafted, must end turn
  if (match.draftSelection.length >= 3) {
    return { type: "END_TURN", meta };
  }

  // If already drafting, continue drafting or end turn
  if (hasDrafted) {
    const gemIndex = getDraftGemIndex(match);
    if (gemIndex !== -1) {
      return { type: "TAKE_GEM", payload: { index: gemIndex }, meta };
    }
    return { type: "END_TURN", meta };
  }

  // Priority 1: Buy affordable reserved cards (highest points first)
  const affordableReserved = getFirstAffordableReservedCard(activePlayer);
  if (affordableReserved) {
    return {
      type: "BUY_RESERVED_CARD",
      payload: { playerId: activePlayer.id, cardId: affordableReserved.id },
      meta
    };
  }

  // Priority 2: Buy affordable market cards (highest points first)
  const affordableMarket = getFirstAffordableMarketCard(match, activePlayer);
  if (affordableMarket) {
    return { type: "BUY_CARD", payload: { cardId: affordableMarket.id }, meta };
  }

  // Priority 3: Draft gems
  const gemIndex = getDraftGemIndex(match);
  if (gemIndex !== -1) {
    return { type: "TAKE_GEM", payload: { index: gemIndex }, meta };
  }

  // Priority 4: Reserve a card if we have no reserved cards
  if (match.market.length > 0 && activePlayer.reservedCards.length === 0) {
    return { type: "RESERVE_CARD", payload: { cardId: match.market[0].id }, meta };
  }

  // Priority 5: Claim scroll if we don't have any
  if (activePlayer.scrolls === 0) {
    return { type: "CLAIM_SCROLL", meta };
  }

  // Fallback: End turn
  return { type: "END_TURN", meta };
}

function runSpectatorStep() {
  if (!state.ui.spectatorRunning) {
    return;
  }

  const action = nextSpectatorAction(state.match);
  dispatch(action);

  if (state.ui.spectatorRunning) {
    spectatorTimer = setTimeout(runSpectatorStep, SPECTATOR_DELAY_MS);
  }
}

function startSpectator() {
  if (state.ui.spectatorRunning || state.match.gameOver) {
    return;
  }

  stopComputerTurnLoop();
  state.ui.spectatorRunning = true;
  pushLog(state.match, "[AUTO] Spectator mode started.");
  persistSnapshot();
  syncSpectatorControls();
  render();
  spectatorTimer = setTimeout(runSpectatorStep, SPECTATOR_DELAY_MS);
}

function stopSpectator(message = "[AUTO] Spectator mode stopped.") {
  if (!state.ui.spectatorRunning) {
    return;
  }

  state.ui.spectatorRunning = false;
  if (spectatorTimer) {
    clearTimeout(spectatorTimer);
    spectatorTimer = null;
  }

  if (message) {
    pushLog(state.match, message);
  }

  persistSnapshot();
  syncSpectatorControls();
  render();
}

function restartSpectator() {
  stopSpectator("");
  resetMatch();
  startSpectator();
}

function stopComputerTurnLoop() {
  if (computerTurnTimer) {
    clearTimeout(computerTurnTimer);
    computerTurnTimer = null;
  }
}

function runComputerTurnStep() {
  if (!isComputerTurn() || state.match.gameOver) {
    stopComputerTurnLoop();
    return;
  }

  const action = nextSpectatorAction(state.match);
  action.meta = { ...(action.meta || {}), source: "computer", ignoreUiGate: true };
  dispatch(action);

  if (isComputerTurn() && !state.match.gameOver) {
    computerTurnTimer = setTimeout(runComputerTurnStep, 450);
  } else {
    stopComputerTurnLoop();
  }
}

function scheduleComputerTurnIfNeeded(delayMs = 380) {
  stopComputerTurnLoop();
  if (!isComputerTurn() || state.match.gameOver || state.ui.spectatorRunning) {
    return;
  }
  computerTurnTimer = setTimeout(runComputerTurnStep, delayMs);
}

function getStateSnapshot() {
  return JSON.parse(
    JSON.stringify({
      match: state.match,
      ui: state.ui
    })
  );
}

function setStateSnapshot(nextState) {
  state.match = cloneMatch(nextState.match);
  state.ui = normalizeUiState(nextState.ui);
}

function shouldForceNewMatchFromUrl() {
  if (!hasDocument || typeof window === "undefined") {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  return params.get("new") === "1";
}

function renderBoard() {
  if (!gemGrid || !hasDocument) {
    return;
  }
  gemGrid.innerHTML = "";
  const matchEnded = Boolean(state.match.gameOver);
  state.match.board.forEach((cell, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `gem-cell gem-${cell.gem}`;
    button.dataset.label = cell.gem.slice(0, 3).toUpperCase();
    if (cell.spent) {
      button.classList.add("is-spent");
    }
    if (state.match.draftSelection.some((pick) => pick.id === cell.id)) {
      button.classList.add("is-selected");
    }
    button.disabled = matchEnded || cell.spent;
    button.addEventListener("click", () => handleGemClick(index));
    gemGrid.appendChild(button);
  });
}

function renderMarket() {
  if (!marketCards || !hasDocument) {
    return;
  }
  marketCards.innerHTML = "";

  if (state.match.market.length === 0) {
    const empty = document.createElement("article");
    empty.className = "market-card";
    empty.innerHTML = "<p>Market empty.</p>";
    marketCards.appendChild(empty);
    return;
  }

  const activePlayer = getActivePlayer();
  const matchEnded = Boolean(state.match.gameOver);

  state.match.market.forEach((card) => {
    const article = document.createElement("article");
    article.className = "market-card";

    const costMarkup = card.cost.map((cost) => `<span class="cost-gem gem-${cost}" title="${cost}"></span>`).join("");

    article.innerHTML = `
      <div class="mc-header">
        <span class="mc-bonus gem-${card.bonusColor}" title="${card.bonusLabel}"></span>
        <span class="mc-title">${card.title}</span>
        <span class="mc-pts">${card.points}</span>
      </div>
      <div class="market-costs">${costMarkup}</div>
      <div class="market-actions">
        <button class="market-button" data-mode="reserve">Rsv</button>
        <button class="market-button primary" data-mode="buy">Buy</button>
      </div>
    `;

    article.querySelectorAll("button").forEach((button) => {
      const mode = button.dataset.mode;
      const isActivePlayerTurn = true; // Market cards are always for the active player
      const isBuyMode = mode === "buy";
      const canAfford = canAffordCard(activePlayer, card);
      const isBuyAction = state.ui.action === "buy";
      const isReserveAction = state.ui.action === "reserve";
      
      if (isBuyMode) {
        button.disabled = !canAfford || matchEnded || isComputerTurn();
      } else if (mode === "reserve") {
        // Disable reserve button if: not in reserve mode, match ended, or computer turn
        button.disabled = !isReserveAction || matchEnded || isComputerTurn();
      } else {
        button.disabled = matchEnded || isComputerTurn();
      }

      button.addEventListener("click", () => handleCardAction(card.id, mode));
    });

    marketCards.appendChild(article);
  });
}

function renderPlayers() {
  const slots = [player1Slot, player2Slot];
  const matchEnded = Boolean(state.match.gameOver);

  if (slots.some(Boolean)) {
    state.match.players.forEach((player, index) => {
      const slot = slots[index];
      if (!slot) return;
      slot.innerHTML = "";
      slot.appendChild(buildPlayerCard(player, index, matchEnded));
    });
  } else if (playerList) {
    playerList.innerHTML = "";
    state.match.players.forEach((player, index) => {
      playerList.appendChild(buildPlayerCard(player, index, matchEnded));
    });
  }
}

function buildPlayerCard(player, index, matchEnded) {

    const card = document.createElement("article");
    card.className = "player-card";
    if (index === state.match.activePlayer) {
      card.classList.add("is-active");
    }

    const tokenMarkup = Object.entries(player.tokens)
      .map(
        ([gem, amount]) => `
          <div class="token-stack">
            <span class="token-gem gem-${gem}" aria-hidden="true"></span>
            <span class="token-name">${gem}</span>
            <strong class="token-count">${amount}</strong>
          </div>
        `
      )
      .join("");

    const purchasedMarkup =
      player.purchasedCards.length === 0
        ? `<p class="cards-empty">No purchased cards yet.</p>`
        : player.purchasedCards
            .map(
              (purchasedCard) => `
                <div class="mini-card bonus-${purchasedCard.bonusColor}">
                  <span>${purchasedCard.title}</span>
                  <strong>+${purchasedCard.points} pts</strong>
                </div>
              `
            )
            .join("");

    const totalBonuses = Object.values(player.bonuses).reduce((sum, value) => sum + value, 0);
    const controlLabel = isComputerControlledIndex(index) ? "Computer" : "Human";

    card.innerHTML = `
      <header>
        <div style="display: flex; align-items: center;">
          <div>
            <h3>${player.name}</h3>
            <p>${player.title} - ${controlLabel}</p>
          </div>
          <button class="cheat-button" onclick="handleCheat('${player.id}')" title="Cheat: Add tokens"></button>
        </div>
        <span class="player-metric">${index === state.match.activePlayer ? "Active" : "Waiting"}</span>
      </header>
      <div class="player-metrics">
        <span class="player-metric">${player.points} points</span>
        <span class="player-metric">${player.reservedCards.length} reserved</span>
        <span class="player-metric">${player.purchasedCards.length} bought</span>
        <span class="player-metric">${totalBonuses} bonuses</span>
        <span class="player-metric">${player.scrolls} scrolls</span>
      </div>
      <div class="play-space">
        <div class="play-space-block">
          <span class="summary-label">Token Stack</span>
          <div class="token-stack-grid">${tokenMarkup}</div>
        </div>
        <div class="play-space-block">
          <span class="summary-label">Purchased Cards</span>
          <div class="mini-card-grid">${purchasedMarkup}</div>
        </div>
      </div>
    `;

    const reservedSection = document.createElement("div");
    reservedSection.className = "reserved-cards";

    const reservedTitle = document.createElement("h4");
    reservedTitle.textContent = "Reserved Cards";
    reservedSection.appendChild(reservedTitle);

    if (player.reservedCards.length === 0) {
      const emptyReserved = document.createElement("p");
      emptyReserved.className = "reserved-empty";
      emptyReserved.textContent = "No reserved cards.";
      reservedSection.appendChild(emptyReserved);
    } else {
      player.reservedCards.forEach((reservedCard) => {
        const row = document.createElement("div");
        row.className = "reserved-row";

        const title = document.createElement("span");
        title.textContent = `${reservedCard.title} (${reservedCard.points} pts)`;

        const buyButton = document.createElement("button");
        buyButton.type = "button";
        buyButton.className = "market-button primary";
        buyButton.textContent = "Buy Reserved";
        const isActivePlayerTurn = index === state.match.activePlayer;
        const canAfford = canAffordCard(player, reservedCard);
        const isBuyAction = state.ui.action === "buy";
        buyButton.disabled = !isActivePlayerTurn || !canAfford || matchEnded || isComputerControlledIndex(index);
        buyButton.addEventListener("click", () => handleReservedCardPurchase(player.id, reservedCard.id));

        row.appendChild(title);
        row.appendChild(buyButton);
        reservedSection.appendChild(row);
      });
    }

    card.appendChild(reservedSection);

    const endTurnBtn = document.createElement("button");
    endTurnBtn.type = "button";
    endTurnBtn.className = "primary-button player-end-turn";
    endTurnBtn.textContent = "End Turn";
    endTurnBtn.disabled = index !== state.match.activePlayer || matchEnded || isComputerControlledIndex(index);
    endTurnBtn.addEventListener("click", () => endTurn());
    card.appendChild(endTurnBtn);

    return card;
}


function renderLog() {
  if (!activityFeed || !hasDocument) {
    return;
  }
  activityFeed.innerHTML = "";
  state.match.log.forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = entry;
    activityFeed.appendChild(item);
  });
}

function renderStatus() {
  if (!turnPill || !statusCopy || !draftCount || !scrollOwner) {
    return;
  }

  const player = getActivePlayer();
  const intent = intentMap[state.ui.action];
  const gameOver = state.match.gameOver;
  const expectedAction = intentStatusMap[state.ui.action];
  const turnGuidance = `${player.name}'s turn. ${expectedAction}`;
  const computerGuidance = isComputerTurn()
    ? `${player.name} (computer) is taking this turn.`
    : turnGuidance;

  turnPill.textContent = `Turn ${state.match.turn} - ${player.name}`;
  statusCopy.textContent = gameOver
    ? `${gameOver.winnerName} wins. ${gameOver.reason}`
    : state.ui.feedback || computerGuidance;
  draftCount.textContent = `${state.match.draftSelection.length} picks`;
  scrollOwner.textContent = state.match.scrollOwner || "No owner";
  if (intentCopy && intentDetail) {
    intentCopy.textContent = intent.title;
    intentDetail.textContent = intent.detail;
  }

  if (gameResultPill && gameResultCopy) {
    if (gameOver) {
      gameResultPill.textContent = "Match Complete";
      gameResultPill.classList.add("is-complete");
      gameResultCopy.textContent = `${gameOver.winnerName} won. ${gameOver.reason}`;
    } else {
      gameResultPill.textContent = "In Progress";
      gameResultPill.classList.remove("is-complete");
      gameResultCopy.textContent = `First to ${VICTORY_TARGET_POINTS} points wins. Empty market also ends it.`;
    }
  }
}

function render() {
  if (!hasDocument) {
    return;
  }
  renderBoard();
  renderMarket();
  renderPlayers();
  renderLog();
  renderStatus();
}

if (hasDocument) {
  // Make handleCheat globally accessible for onclick
  window.handleCheat = handleCheat;
  
  const newMatchButton = document.getElementById("new-match");
  const menuToggle = document.getElementById("menu-toggle");
  const menuDropdown = document.getElementById("menu-dropdown");
  const endGameButton = document.getElementById("end-game");

  if (menuToggle && menuDropdown) {
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      menuDropdown.classList.toggle("hidden");
    });
    document.addEventListener("click", () => menuDropdown.classList.add("hidden"));
    menuDropdown.addEventListener("click", () => menuDropdown.classList.add("hidden"));
  }

  if (endGameButton) {
    endGameButton.addEventListener("click", () => {
      stopSpectator("");
      stopComputerTurnLoop();
      window.location.href = "index.html";
    });
  }

  if (newMatchButton) {
    newMatchButton.addEventListener("click", () => {
      stopSpectator("[AUTO] Spectator stopped due to manual reset.");
      stopComputerTurnLoop();
      resetMatch();
    });
  }

  if (rematchButton) {
    rematchButton.addEventListener("click", () => {
      stopSpectator("[AUTO] Spectator stopped for rematch.");
      stopComputerTurnLoop();
      resetMatch();
    });
  }

  if (claimScrollButton) {
    claimScrollButton.addEventListener("click", () => claimScroll());
  }

  if (startSpectatorButton) {
    startSpectatorButton.addEventListener("click", () => startSpectator());
  }

  if (stopSpectatorButton) {
    stopSpectatorButton.addEventListener("click", () => stopSpectator());
  }

  if (restartSpectatorButton) {
    restartSpectatorButton.addEventListener("click", () => restartSpectator());
  }

  if (matchModeSelect) {
    matchModeSelect.addEventListener("change", (event) => {
      setMatchMode(event.target.value);
    });
  }

  actionChips.forEach((chip) => {
    chip.addEventListener("click", () => setAction(chip.dataset.action));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "s") {
      setAction("scroll");
      claimScroll();
    }
  });

  const forceNewMatch = shouldForceNewMatchFromUrl();
  const restoredSnapshot = forceNewMatch ? null : loadPersistedSnapshot();
  if (restoredSnapshot) {
    setStateSnapshot(restoredSnapshot);
    pushLog(state.match, "[LOCAL] Restored saved match after page reload.");
    state.ui.feedback = "Restored saved match.";
  } else {
    if (forceNewMatch) {
      state.ui.feedback = "Started a new local match.";
    }
    persistSnapshot();
  }

  syncActionChips();
  syncSpectatorControls();
  render();
  scheduleComputerTurnIfNeeded();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    VICTORY_TARGET_POINTS,
    createInitialMatch,
    canAffordCard,
    dispatch,
    setAction,
    resetMatch,
    endTurn,
    claimScroll,
    nextSpectatorAction,
    getStateSnapshot,
    setStateSnapshot
  };
}


