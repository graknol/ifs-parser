const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class GrammarTester {
  constructor() {
    this.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plsql-tests-'));
  }

  /**
   * Parse SQL/PL-SQL code using tree-sitter CLI and return the result
   * @param {string} code - The code to parse
   * @returns {Object} - Parse result with tree and errors
   */
  parseCode(code) {
    // Write code to temporary file
    const tempFile = path.join(this.tempDir, `temp_${Date.now()}.sql`);
    fs.writeFileSync(tempFile, code);

    try {
      // Run tree-sitter parse
      const output = execSync(`tree-sitter parse "${tempFile}"`, {
        cwd: path.resolve(__dirname, '..'),
        encoding: 'utf8',
        timeout: 5000
      });

      // Check for errors in output
      const hasErrors = output.includes('ERROR');
      const errors = this.extractErrors(output);

      return {
        output,
        errors,
        hasErrors,
        success: !hasErrors
      };
    } catch (error) {
      return {
        output: error.stdout || '',
        error: error.message,
        errors: ['Parse failed: ' + error.message],
        hasErrors: true,
        success: false
      };
    } finally {
      // Clean up temp file
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Parse a SQL file and return the result
   * @param {string} filePath - Path to the SQL file
   * @returns {Object} - Parse result
   */
  parseFile(filePath) {
    const code = fs.readFileSync(filePath, 'utf8');
    return this.parseCode(code);
  }

  /**
   * Extract error information from tree-sitter output
   * @param {string} output - Tree-sitter parse output
   * @returns {Array} - Array of error descriptions
   */
  extractErrors(output) {
    const errors = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (line.includes('ERROR')) {
        errors.push(line.trim());
      }
    }

    return errors;
  }

  /**
   * Create a sample SQL file for testing
   * @param {string} filename - Name of the file (without extension)
   * @param {string} content - SQL content
   * @returns {string} - Full path to the created file
   */
  createSample(filename, content) {
    const filePath = path.join(__dirname, 'sql-samples', `${filename}.sql`);
    fs.writeFileSync(filePath, content);
    return filePath;
  }

  /**
   * Get detailed error information as a string
   * @param {Array} errors - Array of error objects
   * @returns {string} - Formatted error message
   */
  formatErrors(errors) {
    if (errors.length === 0) return 'No errors found';

    return errors.join('\n');
  }

  /**
   * Clean up temporary files
   */
  cleanup() {
    try {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

module.exports = GrammarTester;
