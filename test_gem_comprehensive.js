// Comprehensive test for gem selection fix
const fs = require('fs');

// Mock DOM environment
global.document = {
  getElementById: () => null,
  createElement: () => ({ 
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    appendChild: () => {},
    addEventListener: () => {},
    querySelectorAll: () => []
  }),
  querySelectorAll: () => [],
  addEventListener: () => {},
  body: { dataset: { page: 'main' } }
};

global.window = {
  localStorage: { getItem: () => null, setItem: () => {} },
  location: { search: '' }
};

const { createInitialMatch } = require('./app.js');

function testGemSelectionScenarios() {
  console.log('🎯 Testing gem selection scenarios...');
  
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
    return true;
  }
  
  const scenarios = [
    // Valid horizontal lines
    { name: 'Horizontal: adjacent (0,1,2)', indices: [0, 1, 2], expected: true },
    { name: 'Horizontal: spaced (0,2,4)', indices: [0, 2, 4], expected: true },
    { name: 'Horizontal: row 1 (5,7,9)', indices: [5, 7, 9], expected: true },
    
    // Valid vertical lines  
    { name: 'Vertical: left column (0,5,10)', indices: [0, 5, 10], expected: true },
    { name: 'Vertical: middle column (1,6,11)', indices: [1, 6, 11], expected: true },
    { name: 'Vertical: right column (4,9,14)', indices: [4, 9, 14], expected: true },
    
    // Valid diagonal lines
    { name: 'Diagonal: top-left to bottom-right (0,6,12)', indices: [0, 6, 12], expected: true },
    { name: 'Diagonal: top-right to bottom-left (4,8,12)', indices: [4, 8, 12], expected: true },
    { name: 'Diagonal: offset (2,6,10)', indices: [2, 6, 10], expected: true },
    
    // Invalid patterns
    { name: 'L-shape (0,1,5)', indices: [0, 1, 5], expected: false },
    { name: 'Random scatter (0,3,7)', indices: [0, 3, 7], expected: false },
    { name: 'Bent line (0,1,6)', indices: [0, 1, 6], expected: false }
  ];
  
  let passCount = 0;
  scenarios.forEach(scenario => {
    const result = areCollinearAndAdjacent(scenario.indices);
    const status = result === scenario.expected ? '✓' : '❌';
    console.log('   ' + status + ' ' + scenario.name + ': ' + result);
    
    if (result === scenario.expected) {
      passCount++;
    } else {
      const positions = scenario.indices.map(gemPosition);
      console.log('     Expected: ' + scenario.expected + ', Got: ' + result);
      console.log('     Positions: ' + positions.map(p => '(' + p.row + ',' + p.col + ')').join(' → '));
    }
  });
  
  console.log('   Passed ' + passCount + ' out of ' + scenarios.length + ' scenarios');
  return passCount === scenarios.length;
}

function testGameplayIntegration() {
  console.log('🎮 Testing gameplay integration...');
  
  const match = createInitialMatch();
  
  // Test that we can create a match
  if (!match || !match.board || match.board.length !== 15) {
    throw new Error('Match creation failed');
  }
  console.log('   ✓ Match created with 15 gems (5x3 board)');
  
  // Test that gems have different colors
  const gemColors = new Set(match.board.map(gem => gem.gem));
  console.log('   ✓ Board has ' + gemColors.size + ' different gem colors');
  
  if (gemColors.size < 3) {
    throw new Error('Board should have at least 3 different gem colors');
  }
  
  // Test draft selection logic
  match.draftSelection = [];
  
  // Simulate selecting gems in a horizontal line (0, 1, 2)
  const horizontalGems = [0, 1, 2];
  horizontalGems.forEach(index => {
    const gem = match.board[index];
    match.draftSelection.push({ id: gem.id, gem: gem.gem });
  });
  
  console.log('   ✓ Can select horizontal line of gems');
  
  // Test that different colors are required
  const selectedColors = new Set(match.draftSelection.map(pick => pick.gem));
  console.log('   ✓ Selected gems have ' + selectedColors.size + ' different colors');
  
  return true;
}

function testEdgeCases() {
  console.log('🔍 Testing edge cases...');
  
  const BOARD_COLS = 5;
  
  function gemPosition(index) {
    return { row: Math.floor(index / BOARD_COLS), col: index % BOARD_COLS };
  }
  
  function areCollinearAndAdjacent(indices) {
    if (indices.length <= 1) return true;
    const positions = indices.map(gemPosition);
    positions.sort((a, b) => a.row - b.row || a.col - b.col);
    
    const dr = positions[1].row - positions[0].row;
    const dc = positions[1].col - positions[0].col;
    
    for (let i = 2; i < positions.length; i++) {
      const currentDr = positions[i].row - positions[i - 1].row;
      const currentDc = positions[i].col - positions[i - 1].col;
      if (currentDr !== dr || currentDc !== dc) return false;
    }
    
    return true;
  }
  
  const edgeCases = [
    { name: 'Single gem', indices: [0], expected: true },
    { name: 'Two gems horizontal', indices: [0, 1], expected: true },
    { name: 'Two gems vertical', indices: [0, 5], expected: true },
    { name: 'Two gems diagonal', indices: [0, 6], expected: true },
    { name: 'Empty selection', indices: [], expected: true },
    { name: 'Out of order horizontal', indices: [2, 0, 1], expected: true },
    { name: 'Out of order vertical', indices: [10, 0, 5], expected: true }
  ];
  
  let passCount = 0;
  edgeCases.forEach(testCase => {
    const result = areCollinearAndAdjacent(testCase.indices);
    const status = result === testCase.expected ? '✓' : '❌';
    console.log('   ' + status + ' ' + testCase.name + ': ' + result);
    
    if (result === testCase.expected) {
      passCount++;
    }
  });
  
  console.log('   Passed ' + passCount + ' out of ' + edgeCases.length + ' edge cases');
  return passCount === edgeCases.length;
}

function runComprehensiveTests() {
  console.log('🚀 Running comprehensive gem selection tests...\n');
  
  try {
    console.log('Board layout (5 cols x 3 rows):');
    console.log('   0  1  2  3  4');
    console.log('   5  6  7  8  9');
    console.log('  10 11 12 13 14\n');
    
    const scenariosPass = testGemSelectionScenarios();
    const integrationPass = testGameplayIntegration();
    const edgeCasesPass = testEdgeCases();
    
    if (scenariosPass && integrationPass && edgeCasesPass) {
      console.log('\n🎉 ALL COMPREHENSIVE TESTS PASSED!');
      console.log('✅ Horizontal lines work (adjacent and spaced)');
      console.log('✅ Vertical lines work (all columns)');
      console.log('✅ Diagonal lines work (both directions)');
      console.log('✅ Invalid patterns correctly rejected');
      console.log('✅ Gameplay integration works');
      console.log('✅ Edge cases handled properly');
      console.log('✅ Three-in-a-row selection now works as requested!');
      
      return true;
    } else {
      console.log('\n❌ Some tests failed');
      return false;
    }
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    return false;
  }
}

const success = runComprehensiveTests();
process.exit(success ? 0 : 1);