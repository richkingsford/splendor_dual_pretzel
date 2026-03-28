const { createInitialMatch } = require('./app.js');

function testMarketExpansion() {
  console.log('Testing market expansion...');
  
  const match = createInitialMatch();
  
  // Test that we have more cards now
  const cardCount = match.market.length;
  console.log(`Market has ${cardCount} cards`);
  
  if (cardCount < 40) {
    throw new Error(`Expected at least 40 cards, got ${cardCount}`);
  }
  
  // Test that cards have proper structure
  const firstCard = match.market[0];
  const requiredFields = ['id', 'title', 'points', 'bonusLabel', 'bonusColor', 'cost'];
  
  for (const field of requiredFields) {
    if (!(field in firstCard)) {
      throw new Error(`Card missing required field: ${field}`);
    }
  }
  
  // Test that we have variety in card costs and points
  const pointValues = [...new Set(match.market.map(card => card.points))];
  const bonusColors = [...new Set(match.market.map(card => card.bonusColor))];
  
  if (pointValues.length < 3) {
    throw new Error('Expected variety in point values');
  }
  
  if (bonusColors.length < 5) {
    throw new Error('Expected all 5 gem colors represented');
  }
  
  console.log('✓ Market expansion test passed');
  console.log(`✓ Point values: ${pointValues.sort().join(', ')}`);
  console.log(`✓ Bonus colors: ${bonusColors.join(', ')}`);
}

function testCardAffordability() {
  console.log('Testing card affordability logic...');
  
  const match = createInitialMatch();
  const player = match.players[0];
  
  // Give player some tokens
  player.tokens.ruby = 3;
  player.tokens.sapphire = 2;
  player.tokens.emerald = 1;
  
  // Find a card the player can afford
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
  
  console.log(`✓ Player can afford ${affordableCards.length} cards`);
  
  if (affordableCards.length === 0) {
    console.log('✓ No affordable cards (expected with limited tokens)');
  }
}

// Run tests
try {
  testMarketExpansion();
  testCardAffordability();
  console.log('\n🎉 All tests passed!');
} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  process.exit(1);
}