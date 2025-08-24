#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PLSQLBisector {
  constructor(filePath, grammarPath) {
    this.filePath = filePath;
    this.grammarPath = grammarPath;
    this.tempDir = path.join(__dirname, 'temp_bisect');

    // Create temp directory if it doesn't exist
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir);
    }

    // Read the full file
    this.fileContent = fs.readFileSync(filePath, 'utf-8');
    this.lines = this.fileContent.split('\n');

    console.log(`Loaded file with ${this.lines.length} lines`);
  }

  // Test if a chunk of code parses successfully
  testParse(content) {
    const tempFile = path.join(this.tempDir, 'test.plsql');
    fs.writeFileSync(tempFile, content);

    try {
      const result = execSync(`tree-sitter parse "${tempFile}"`, {
        cwd: this.grammarPath,
        encoding: 'utf-8',
        timeout: 10000
      });

      // Check for ERROR in the output
      const hasError = result.includes('ERROR');
      return !hasError;
    } catch (error) {
      return false;
    }
  }

  // Binary search to find the exact line where parsing breaks
  bisectByLines(startLine = 1, endLine = null) {
    if (endLine === null) {
      endLine = this.lines.length;
    }

    console.log(`\nBisecting lines ${startLine} to ${endLine}`);

    let left = startLine;
    let right = endLine;
    let lastGoodLine = startLine - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const testContent = this.lines.slice(0, mid).join('\n');

      console.log(`Testing up to line ${mid}...`);

      if (this.testParse(testContent)) {
        lastGoodLine = mid;
        left = mid + 1;
        console.log(`  ✓ Lines 1-${mid} parse successfully`);
      } else {
        right = mid - 1;
        console.log(`  ✗ Lines 1-${mid} fail to parse`);
      }
    }

    return lastGoodLine;
  }

  // Find the exact breaking point and show context
  findBreakingPoint() {
    console.log('='.repeat(60));
    console.log('PLSQL PARSING BISECTION');
    console.log('='.repeat(60));

    const lastGoodLine = this.bisectByLines();
    const breakingLine = lastGoodLine + 1;

    console.log('\n' + '='.repeat(60));
    console.log('RESULTS:');
    console.log('='.repeat(60));
    console.log(`Last successfully parsed line: ${lastGoodLine}`);
    console.log(`First breaking line: ${breakingLine}`);

    if (breakingLine <= this.lines.length) {
      console.log('\n' + '-'.repeat(40));
      console.log('CONTEXT AROUND BREAKING POINT:');
      console.log('-'.repeat(40));

      // Show 5 lines before and after the breaking point
      const contextStart = Math.max(1, breakingLine - 5);
      const contextEnd = Math.min(this.lines.length, breakingLine + 5);

      for (let i = contextStart; i <= contextEnd; i++) {
        const lineNum = i.toString().padStart(4, ' ');
        const marker = i === breakingLine ? ' >>> ' : '     ';
        console.log(`${lineNum}:${marker}${this.lines[i - 1]}`);
      }

      console.log('\n' + '-'.repeat(40));
      console.log('BREAKING LINE ANALYSIS:');
      console.log('-'.repeat(40));
      const breakingLineContent = this.lines[breakingLine - 1];
      console.log(`Line ${breakingLine}: "${breakingLineContent}"`);
      console.log(`Length: ${breakingLineContent.length} characters`);

      // Show byte representation
      const bytes = Array.from(breakingLineContent).map(c => {
        const code = c.charCodeAt(0);
        if (code >= 32 && code <= 126) {
          return c;
        } else {
          return `\\x${code.toString(16).padStart(2, '0')}`;
        }
      }).join('');
      console.log(`Bytes: ${bytes}`);

      // Check for common issues
      this.analyzeBreakingLine(breakingLineContent, breakingLine);
    }

    return breakingLine;
  }

  // Analyze the breaking line for common parsing issues
  analyzeBreakingLine(line, lineNumber) {
    console.log('\n' + '-'.repeat(40));
    console.log('POTENTIAL ISSUES:');
    console.log('-'.repeat(40));

    const issues = [];

    // Check for multiple spaces
    if (/\s{2,}/.test(line)) {
      issues.push('Contains multiple consecutive spaces');
    }

    // Check for tabs
    if (/\t/.test(line)) {
      issues.push('Contains tab characters');
    }

    // Check for non-ASCII characters
    if (/[^\x00-\x7F]/.test(line)) {
      issues.push('Contains non-ASCII characters');
    }

    // Check for missing semicolon if it looks like a statement
    if (line.trim() && !line.trim().endsWith(';') && !line.trim().endsWith('(') && !line.includes('--')) {
      if (!/^(BEGIN|END|IF|ELSE|ELSIF|LOOP|FOR|WHILE|DECLARE|FUNCTION|PROCEDURE|IS|AS|THEN)/.test(line.trim().toUpperCase())) {
        issues.push('Possible missing semicolon');
      }
    }

    // Check for unmatched parentheses in this line
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      issues.push(`Unmatched parentheses (${openParens} open, ${closeParens} close)`);
    }

    if (issues.length === 0) {
      console.log('No obvious formatting issues detected');
    } else {
      issues.forEach(issue => console.log(`- ${issue}`));
    }
  }

  // Create a test file with just the problematic section
  createMinimalTest(breakingLine) {
    console.log('\n' + '-'.repeat(40));
    console.log('CREATING MINIMAL TEST CASE:');
    console.log('-'.repeat(40));

    // Get some context around the breaking point
    const contextStart = Math.max(0, breakingLine - 10);
    const contextEnd = Math.min(this.lines.length, breakingLine + 5);

    const testContent = this.lines.slice(contextStart, contextEnd).join('\n');
    const testFile = path.join(this.tempDir, 'minimal_test.plsql');

    fs.writeFileSync(testFile, testContent);
    console.log(`Minimal test case saved to: ${testFile}`);
    console.log('Content:');
    console.log('-'.repeat(20));
    console.log(testContent);
    console.log('-'.repeat(20));

    return testFile;
  }

  // Clean up temporary files
  cleanup() {
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    }
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: node bisect.js <plsql-file> [grammar-path]');
    console.log('Example: node bisect.js Project.plsql ../grammars/ifs-cloud-parser');
    process.exit(1);
  }

  const filePath = args[0];
  const grammarPath = args[1] || '../grammars/ifs-cloud-parser';

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const bisector = new PLSQLBisector(filePath, grammarPath);

  try {
    const breakingLine = bisector.findBreakingPoint();
    bisector.createMinimalTest(breakingLine);
  } catch (error) {
    console.error('Error during bisection:', error.message);
  } finally {
    bisector.cleanup();
  }
}

if (require.main === module) {
  main();
}

module.exports = PLSQLBisector;
