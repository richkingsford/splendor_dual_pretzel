// Regression test for widescreen layout issues
const fs = require('fs');

function testWidescreenLayoutIssues() {
  console.log('🖥️ Testing widescreen layout regression...');
  
  const cssContent = fs.readFileSync('./styles.css', 'utf8');
  
  const issues = [];
  
  // Issue 1: Center column max-width constraint on widescreen
  if (cssContent.includes('max-width: 420px') && cssContent.includes('.center-column')) {
    console.log('   ❌ ISSUE: Center column has restrictive max-width (420px)');
    console.log('      This causes poor space utilization on widescreen displays');
    issues.push('center-column-width');
  }
  
  // Issue 2: Market cards grid may be too narrow
  const marketCardsMatch = cssContent.match(/\.market-cards[^}]*grid-template-columns[^;]*minmax\((\d+)px/);
  if (marketCardsMatch && parseInt(marketCardsMatch[1]) < 140) {
    console.log('   ❌ ISSUE: Market cards minimum width too small (' + marketCardsMatch[1] + 'px)');
    console.log('      Cards may be too cramped on widescreen displays');
    issues.push('market-cards-width');
  }
  
  // Issue 3: Dashboard grid proportions
  if (cssContent.includes('grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr) minmax(0, 1fr)')) {
    console.log('   ❌ ISSUE: Dashboard grid has uneven proportions');
    console.log('      Center column only slightly larger than sides');
    issues.push('dashboard-proportions');
  }
  
  // Issue 4: Page shell width constraint
  if (cssContent.includes('width: min(1160px, calc(100% - 2rem))')) {
    console.log('   ❌ ISSUE: Page shell max-width too restrictive (1160px)');
    console.log('      Wastes space on large widescreen displays');
    issues.push('page-shell-width');
  }
  
  // Issue 5: Missing widescreen media queries
  const hasWidescreenQueries = cssContent.includes('@media (min-width:') && 
                               (cssContent.includes('1200px') || cssContent.includes('1400px'));
  if (!hasWidescreenQueries) {
    console.log('   ❌ ISSUE: No widescreen-specific media queries');
    console.log('      Layout not optimized for large displays');
    issues.push('missing-widescreen-queries');
  }
  
  return issues;
}

function generateWidescreenFixes(issues) {
  console.log('\\n🔧 Generating fixes for widescreen issues...');
  
  const fixes = [];
  
  if (issues.includes('center-column-width')) {
    fixes.push({
      description: 'Remove restrictive max-width from center column',
      oldCSS: '.center-column {\\n  display: grid;\\n  gap: 1rem;\\n  max-width: 420px;\\n  margin: 0 auto;\\n}',
      newCSS: '.center-column {\\n  display: grid;\\n  gap: 1rem;\\n  margin: 0 auto;\\n}'
    });
  }
  
  if (issues.includes('market-cards-width')) {
    fixes.push({
      description: 'Increase market card minimum width for better readability',
      oldCSS: 'grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));',
      newCSS: 'grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));'
    });
  }
  
  if (issues.includes('dashboard-proportions')) {
    fixes.push({
      description: 'Improve dashboard grid proportions for widescreen',
      oldCSS: 'grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr) minmax(0, 1fr);',
      newCSS: 'grid-template-columns: minmax(300px, 1fr) minmax(400px, 1.5fr) minmax(300px, 1fr);'
    });
  }
  
  if (issues.includes('page-shell-width')) {
    fixes.push({
      description: 'Increase page shell max-width for better widescreen utilization',
      oldCSS: 'width: min(1160px, calc(100% - 2rem));',
      newCSS: 'width: min(1400px, calc(100% - 2rem));'
    });
  }
  
  if (issues.includes('missing-widescreen-queries')) {
    fixes.push({
      description: 'Add widescreen media queries for optimal layout',
      newCSS: `
@media (min-width: 1200px) {
  .dashboard {
    gap: 1.5rem;
  }
  
  .center-column {
    max-width: 500px;
  }
  
  .market-cards {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}

@media (min-width: 1600px) {
  .page-shell {
    width: min(1600px, calc(100% - 4rem));
  }
  
  .dashboard {
    grid-template-columns: minmax(350px, 1fr) minmax(500px, 1.6fr) minmax(350px, 1fr);
    gap: 2rem;
  }
}`
    });
  }
  
  return fixes;
}

function runRegressionTest() {
  console.log('🚀 Running widescreen layout regression test...\\n');
  
  try {
    const issues = testWidescreenLayoutIssues();
    
    if (issues.length === 0) {
      console.log('\\n✅ No widescreen layout issues detected');
      return true;
    }
    
    console.log('\\n📋 Found ' + issues.length + ' widescreen layout issues');
    
    const fixes = generateWidescreenFixes(issues);
    
    console.log('\\n🔧 Recommended fixes:');
    fixes.forEach((fix, index) => {
      console.log('\\n' + (index + 1) + '. ' + fix.description);
      if (fix.oldCSS) {
        console.log('   Replace: ' + fix.oldCSS.replace(/\\n/g, ' '));
      }
      console.log('   With: ' + fix.newCSS.replace(/\\n/g, ' '));
    });
    
    console.log('\\n⚠️  REGRESSION DETECTED: Layout issues found on widescreen displays');
    console.log('🔧 Apply the recommended fixes to resolve widescreen layout problems');
    
    return false;
  } catch (error) {
    console.error('\\n❌ REGRESSION TEST FAILED:', error.message);
    return false;
  }
}

const success = runRegressionTest();
process.exit(success ? 0 : 1);