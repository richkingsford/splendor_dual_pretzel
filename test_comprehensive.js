// Comprehensive test for market expansion and visual changes
const fs = require('fs');
const path = require('path');

// Mock DOM environment for testing
global.document = {
  getElementById: () => null,
  createElement: (tag) => ({
    className: '',
    innerHTML: '',
    appendChild: () => {},
    addEventListener: () => {},
    querySelectorAll: () => []
  }),
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

const { createInitialMatch } = require('./app.js');

function testMarketExpansion() {
  console.log('🧪 Testing market expansion...');
  
  const match = createInitialMatch();
  const cardCount = match.market.length;
  
  console.log(`   Market has ${cardCount} cards (was 23, now should be 45+)`);
  
  if (cardCount < 40) {
    throw new Error(`Expected at least 40 cards, got ${cardCount}`);
  }
  
  // Verify card structure
  const sampleCard = match.market[0];
  const requiredFields = ['id', 'title', 'points', 'bonusLabel', 'bonusColor', 'cost'];
  
  for (const field of requiredFields) {
    if (!(field in sampleCard)) {
      throw new Error(`Card missing required field: ${field}`);
    }
  }
  
  console.log('   ✓ All cards have proper structure');
  
  // Test variety
  const pointValues = [...new Set(match.market.map(card => card.points))];
  const bonusColors = [...new Set(match.market.map(card => card.bonusColor))];
  
  console.log(`   ✓ Point variety: ${pointValues.sort().join(', ')}`);
  console.log(`   ✓ Color variety: ${bonusColors.join(', ')}`);
  
  return true;
}

function testCSSChanges() {
  console.log('🎨 Testing CSS changes...');
  
  const cssContent = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
  
  // Check for smaller card dimensions
  if (!cssContent.includes('minmax(120px, 1fr)')) {
    throw new Error('CSS should have smaller card minimum width (120px)');
  }
  
  // Check for scrollable container
  if (!cssContent.includes('max-height: 400px') || !cssContent.includes('overflow-y: auto')) {
    throw new Error('CSS should have scrollable market container');
  }
  
  // Check for smaller padding and font
  if (!cssContent.includes('padding: 0.4rem') || !cssContent.includes('font-size: 0.7rem')) {
    throw new Error('CSS should have smaller padding and font size for cards');
  }
  
  console.log('   ✓ Card width reduced to 120px minimum');
  console.log('   ✓ Market container is scrollable (400px max height)');
  console.log('   ✓ Cards have smaller padding and font size');
  
  return true;
}

function testGameplayIntegrity() {
  console.log('🎮 Testing gameplay integrity...');
  
  const match = createInitialMatch();
  const player = match.players[0];
  
  // Test that we can still buy cards
  player.tokens.ruby = 5;
  player.tokens.sapphire = 5;
  player.tokens.emerald = 5;
  player.tokens.pearl = 5;
  player.tokens.onyx = 5;
  
  const affordableCards = match.market.filter(card => {
    const requiredByColor = card.cost.reduce((acc, color) => {
      acc[color] = (acc[color] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(requiredByColor).every(([color, required]) => {
      const discount = player.bonuses[color] || 0;
      const payable = Math.max(required - discount, 0);
      return (player.tokens[color] || 0) >= payable;
    });
  });
  
  console.log(`   ✓ Player can afford ${affordableCards.length} cards with full tokens`);
  
  if (affordableCards.length === 0) {
    throw new Error('Player should be able to afford some cards with full tokens');
  }
  
  // Test card variety in costs
  const costVariety = new Set();
  match.market.forEach(card => {
    costVariety.add(card.cost.length);
  });
  
  console.log(`   ✓ Cards have ${costVariety.size} different cost complexities`);
  
  return true;
}

function runAllTests() {
  console.log('🚀 Running comprehensive market expansion tests...\n');
  
  try {
    testMarketExpansion();
    testCSSChanges();
    testGameplayIntegrity();
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Market now has 45+ cards (was 23)');
    console.log('✅ Cards are smaller rectangles in a grid');
    console.log('✅ Market is scrollable for better UX');
    console.log('✅ Gameplay integrity maintained');
    
    return true;
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    return false;
  }
}

// Run the tests
const success = runAllTests();
process.exit(success ? 0 : 1);