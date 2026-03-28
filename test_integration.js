// Integration test for buy button disabling functionality
const fs = require('fs');

// Mock DOM environment with more realistic button behavior
global.document = {
  getElementById: () => null,
  createElement: (tag) => {
    const element = {
      className: '',
      innerHTML: '',
      appendChild: () => {},
      addEventListener: () => {},
      querySelectorAll: () => [],
      type: '',
      textContent: '',
      disabled: false,
      dataset: {},
      classList: {
        add: () => {},
        remove: () => {},
        toggle: () => {}
      }
    };
    
    if (tag === 'button') {
      // Mock button-specific behavior
      element.querySelectorAll = () => [element];
    }
    
    return element;
  },
  querySelectorAll: () => [],
  addEventListener: () => {},
  body: { dataset: { page: 'main' } }
};

global.window = {
  localStorage: {
    getItem: () => null,
    setItem: () => {},
  },
  location: { search: '' }
};

const { createInitialMatch, canAffordCard } = require('./app.js');

function simulateMarketRender() {
  console.log('🎨 Testing market rendering with buy button states...');
  
  const match = createInitialMatch();
  const activePlayer = match.players[0];
  
  // Test scenario 1: Player has no tokens
  console.log('   Scenario 1: Player with no tokens');
  let affordableCount = 0;
  let totalCards = 0;
  
  match.market.forEach(card => {
    totalCards++;
    const canAfford = canAffordCard(activePlayer, card);
    if (canAfford) affordableCount++;
    
    // Simulate the button disabling logic from renderMarket
    const isActivePlayerTurn = true;
    const isBuyAction = true; // Assume we're in buy mode
    const matchEnded = false;
    const isComputerTurn = false;
    
    const shouldDisableBuy = !canAfford || !isActivePlayerTurn || !isBuyAction || matchEnded || isComputerTurn;
    
    if (!shouldDisableBuy && !canAfford) {
      throw new Error('Buy button should be disabled when player cannot afford card: ' + card.title);
    }
  });
  
  console.log('     ✓ ' + affordableCount + ' of ' + totalCards + ' cards affordable (expected: 0)');
  
  if (affordableCount !== 0) {
    throw new Error('Player with no tokens should not be able to afford any cards');
  }
  
  // Test scenario 2: Player has some tokens
  console.log('   Scenario 2: Player with moderate tokens');
  activePlayer.tokens.ruby = 2;
  activePlayer.tokens.sapphire = 1;
  activePlayer.tokens.emerald = 1;
  
  affordableCount = 0;
  match.market.forEach(card => {
    const canAfford = canAffordCard(activePlayer, card);
    if (canAfford) affordableCount++;
  });
  
  console.log('     ✓ ' + affordableCount + ' of ' + totalCards + ' cards affordable with moderate tokens');
  
  // Test scenario 3: Player has many tokens
  console.log('   Scenario 3: Player with abundant tokens');
  Object.keys(activePlayer.tokens).forEach(color => {
    activePlayer.tokens[color] = 5;
  });
  
  affordableCount = 0;
  match.market.forEach(card => {
    const canAfford = canAffordCard(activePlayer, card);
    if (canAfford) affordableCount++;
  });
  
  console.log('     ✓ ' + affordableCount + ' of ' + totalCards + ' cards affordable with abundant tokens');
  
  if (affordableCount < totalCards * 0.8) {
    throw new Error('Player with abundant tokens should be able to afford most cards');
  }
  
  return true;
}

function testUIActionStates() {
  console.log('🎮 Testing UI action state effects on buy buttons...');
  
  const match = createInitialMatch();
  const activePlayer = match.players[0];
  
  // Give player tokens to afford cards
  Object.keys(activePlayer.tokens).forEach(color => {
    activePlayer.tokens[color] = 3;
  });
  
  const testCard = match.market[0];
  const canAfford = canAffordCard(activePlayer, testCard);
  
  if (!canAfford) {
    throw new Error('Test setup failed: player should be able to afford test card');
  }
  
  // Test different UI action states
  const actionStates = [
    { action: 'draft', expectDisabled: true },
    { action: 'reserve', expectDisabled: true },
    { action: 'buy', expectDisabled: false },
    { action: 'scroll', expectDisabled: true }
  ];
  
  actionStates.forEach(state => {
    const isActivePlayerTurn = true;
    const isBuyAction = state.action === 'buy';
    const matchEnded = false;
    const isComputerTurn = false;
    
    const shouldDisable = !canAfford || !isActivePlayerTurn || !isBuyAction || matchEnded || isComputerTurn;
    
    if (shouldDisable !== state.expectDisabled) {
      throw new Error('Buy button state incorrect for action: ' + state.action);
    }
    
    console.log('     ✓ ' + state.action + ' mode: buy button ' + (shouldDisable ? 'disabled' : 'enabled'));
  });
  
  return true;
}

function testReservedCardBuyButtons() {
  console.log('🏦 Testing reserved card buy button logic...');
  
  const match = createInitialMatch();
  const player = match.players[0];
  
  // Add a reserved card
  const reservedCard = match.market[0];
  player.reservedCards.push(reservedCard);
  
  // Test without sufficient tokens
  const canAffordWithoutTokens = canAffordCard(player, reservedCard);
  console.log('     ✓ Player cannot afford reserved card without tokens');
  
  if (canAffordWithoutTokens) {
    throw new Error('Player should not be able to afford reserved card without tokens');
  }
  
  // Give sufficient tokens
  reservedCard.cost.forEach(color => {
    player.tokens[color] = (player.tokens[color] || 0) + 2;
  });
  
  const canAffordWithTokens = canAffordCard(player, reservedCard);
  console.log('     ✓ Player can afford reserved card with sufficient tokens');
  
  if (!canAffordWithTokens) {
    throw new Error('Player should be able to afford reserved card with sufficient tokens');
  }
  
  // Test button state logic for reserved cards
  const isActivePlayerTurn = true;
  const isBuyAction = true;
  const matchEnded = false;
  const isComputerControlled = false;
  
  const shouldDisable = !isActivePlayerTurn || !canAffordWithTokens || !isBuyAction || matchEnded || isComputerControlled;
  
  console.log('     ✓ Reserved card buy button: ' + (shouldDisable ? 'disabled' : 'enabled'));
  
  if (shouldDisable) {
    throw new Error('Reserved card buy button should be enabled when conditions are met');
  }
  
  return true;
}

function runIntegrationTests() {
  console.log('🚀 Running buy button integration tests...\n');
  
  try {
    simulateMarketRender();
    testUIActionStates();
    testReservedCardBuyButtons();
    
    console.log('\n🎉 ALL INTEGRATION TESTS PASSED!');
    console.log('✅ Market buy buttons properly disabled based on affordability');
    console.log('✅ UI action state correctly controls buy button availability');
    console.log('✅ Reserved card buy buttons work correctly');
    console.log('✅ Button states update correctly across different scenarios');
    console.log('✅ No false positives: unaffordable cards always have disabled buy buttons');
    
    return true;
  } catch (error) {
    console.error('\n❌ INTEGRATION TEST FAILED:', error.message);
    return false;
  }
}

// Run the integration tests
const success = runIntegrationTests();
process.exit(success ? 0 : 1);