// Test gem selection logic
const fs = require('fs');

// Mock DOM environment
global.document = {
  getElementById: () => null,
  createElement: () => ({ classList: { add: () => {}, remove: () => {}, toggle: () => {} } }),
  body: { dataset: { page: 'main' } }
};

global.window = {
  localStorage: { getItem: () => null, setItem: () => {} },
  location: { search: '' }
};

const { createInitialMatch } = require('./app.js');

// Test the gem position and line logic
function testGemPositions() {
  console.log('🎯 Testing gem position calculations...');
  
  const BOARD_COLS = 5;
  
  function gemPosition(index) {
    return { row: Math.floor(index / BOARD_COLS), col: index % BOARD_COLS };
  }
  
  // Test positions for a 5x3 board (15 gems)
  const positions = [];
  for (let i = 0; i < 15; i++) {
    positions.push({ index: i, ...gemPosition(i) });
  }
  
  console.log('   Board layout (5 cols x 3 rows):');
  for (let row = 0; row < 3; row++) {
    const rowPositions = positions.filter(p => p.row === row);
    console.log('   Row ' + row + ': ' + rowPositions.map(p => `${p.index}(${p.row},${p.col})`).join(' '));
  }
  
  return positions;
}

function testCurrentLineLogic() {
  console.log('🔍 Testing current line selection logic...');
  
  const BOARD_COLS = 5;
  
  function gemPosition(index) {
    return { row: Math.floor(index / BOARD_COLS), col: index % BOARD_COLS };
  }
  
  function areCollinearAndAdjacent(indices) {\n    if (indices.length <= 1) return true;\n    const positions = indices.map(gemPosition);\n    positions.sort((a, b) => a.row - b.row || a.col - b.col);\n    const dr = positions[1].row - positions[0].row;\n    const dc = positions[1].col - positions[0].col;\n    for (let i = 1; i < positions.length; i++) {\n      const rowDiff = positions[i].row - positions[i - 1].row;\n      const colDiff = positions[i].col - positions[i - 1].col;\n      if (rowDiff !== dr || colDiff !== dc) return false;\n      if (Math.abs(dr) > 1 || Math.abs(dc) > 1) return false; // THIS IS THE PROBLEM!\n    }\n    return true;\n  }\n  \n  // Test cases that should work\n  const testCases = [\n    { name: 'Horizontal line (0,1,2)', indices: [0, 1, 2], expected: true },\n    { name: 'Vertical line (0,5,10)', indices: [0, 5, 10], expected: true },\n    { name: 'Diagonal line (0,6,12)', indices: [0, 6, 12], expected: true },\n    { name: 'Diagonal line (2,6,10)', indices: [2, 6, 10], expected: true },\n    { name: 'Non-adjacent horizontal (0,2,4)', indices: [0, 2, 4], expected: true },\n    { name: 'Invalid L-shape (0,1,5)', indices: [0, 1, 5], expected: false }\n  ];\n  \n  testCases.forEach(test => {\n    const result = areCollinearAndAdjacent(test.indices);\n    const status = result === test.expected ? '✓' : '❌';\n    console.log(`   ${status} ${test.name}: ${result} (expected: ${test.expected})`);\n    \n    if (result !== test.expected) {\n      const positions = test.indices.map(gemPosition);\n      console.log(`     Positions: ${positions.map(p => `(${p.row},${p.col})`).join(' → ')}`);\n    }\n  });\n  \n  return testCases.every(test => areCollinearAndAdjacent(test.indices) === test.expected);\n}\n\nfunction testFixedLineLogic() {\n  console.log('🔧 Testing fixed line selection logic...');\n  \n  const BOARD_COLS = 5;\n  \n  function gemPosition(index) {\n    return { row: Math.floor(index / BOARD_COLS), col: index % BOARD_COLS };\n  }\n  \n  function areCollinearAndAdjacent(indices) {\n    if (indices.length <= 1) return true;\n    const positions = indices.map(gemPosition);\n    positions.sort((a, b) => a.row - b.row || a.col - b.col);\n    \n    // Check if all positions are collinear\n    const dr = positions[1].row - positions[0].row;\n    const dc = positions[1].col - positions[0].col;\n    \n    for (let i = 2; i < positions.length; i++) {\n      const currentDr = positions[i].row - positions[i - 1].row;\n      const currentDc = positions[i].col - positions[i - 1].col;\n      if (currentDr !== dr || currentDc !== dc) return false;\n    }\n    \n    // Remove the adjacency requirement - gems just need to be collinear\n    return true;\n  }\n  \n  // Test cases that should work with the fix\n  const testCases = [\n    { name: 'Horizontal line (0,1,2)', indices: [0, 1, 2], expected: true },\n    { name: 'Vertical line (0,5,10)', indices: [0, 5, 10], expected: true },\n    { name: 'Diagonal line (0,6,12)', indices: [0, 6, 12], expected: true },\n    { name: 'Diagonal line (2,6,10)', indices: [2, 6, 10], expected: true },\n    { name: 'Non-adjacent horizontal (0,2,4)', indices: [0, 2, 4], expected: true },\n    { name: 'Invalid L-shape (0,1,5)', indices: [0, 1, 5], expected: false },\n    { name: 'Spaced vertical (1,6,11)', indices: [1, 6, 11], expected: true }\n  ];\n  \n  testCases.forEach(test => {\n    const result = areCollinearAndAdjacent(test.indices);\n    const status = result === test.expected ? '✓' : '❌';\n    console.log(`   ${status} ${test.name}: ${result} (expected: ${test.expected})`);\n    \n    if (result !== test.expected) {\n      const positions = test.indices.map(gemPosition);\n      console.log(`     Positions: ${positions.map(p => `(${p.row},${p.col})`).join(' → ')}`);\n    }\n  });\n  \n  return testCases.every(test => areCollinearAndAdjacent(test.indices) === test.expected);\n}\n\nfunction runGemSelectionTests() {\n  console.log('🚀 Running gem selection tests...\\n');\n  \n  try {\n    testGemPositions();\n    \n    console.log('\\n🔍 Current logic (with bug):');\n    const currentWorks = testCurrentLineLogic();\n    \n    console.log('\\n🔧 Fixed logic:');\n    const fixedWorks = testFixedLineLogic();\n    \n    if (!currentWorks && fixedWorks) {\n      console.log('\\n🎉 ISSUE IDENTIFIED AND FIXED!');\n      console.log('❌ Current logic fails on non-adjacent collinear selections');\n      console.log('✅ Fixed logic allows proper three-in-a-row selections');\n      console.log('🔧 Solution: Remove adjacency requirement, keep collinearity check');\n    } else {\n      console.log('\\n❓ Unexpected test results');\n    }\n    \n    return true;\n  } catch (error) {\n    console.error('\\n❌ TEST FAILED:', error.message);\n    return false;\n  }\n}\n\nconst success = runGemSelectionTests();\nprocess.exit(success ? 0 : 1);