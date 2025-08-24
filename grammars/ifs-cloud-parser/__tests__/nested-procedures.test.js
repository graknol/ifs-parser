const { execSync, writeFileSync, unlinkSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function parseSQL(sql) {
  // Create a temporary file for tree-sitter to parse
  const tempFile = path.join(__dirname, 'temp_test.plsql');
  try {
    fs.writeFileSync(tempFile, sql, 'utf-8');
    const result = execSync(`npx tree-sitter parse "${tempFile}"`, {
      cwd: path.join(__dirname, '..'),  // Run from grammar root
      encoding: 'utf-8',
      timeout: 5000
    });
    return result;
  } catch (error) {
    throw new Error(`Parse failed: ${error.message}\nSQL: ${sql}`);
  } finally {
    // Clean up temporary file
    try {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
}

function expectParseSuccess(sql, description = '') {
  try {
    const result = parseSQL(sql);
    expect(result).toBeDefined();
    expect(result).not.toContain('ERROR');
    return result;
  } catch (error) {
    throw new Error(`${description ? description + ': ' : ''}${error.message}`);
  }
}

function expectParseTree(sql, expectedNodes, description = '') {
  const result = expectParseSuccess(sql, description);
  expectedNodes.forEach(node => {
    expect(result).toContain(node);
  });
  return result;
}

describe('Nested Procedures and Functions', () => {
  describe('Basic nested procedure support', () => {
    test('Simple nested procedure should parse without errors', () => {
      const sql = `
        PROCEDURE Outer_Proc___ IS
          PROCEDURE Inner_Proc___ IS
          BEGIN
            NULL;
          END Inner_Proc___;
        BEGIN
          Inner_Proc___;
        END Outer_Proc___;
      `;

      const result = expectParseSuccess(sql, 'Simple nested procedure should parse successfully');
      expect(result).toContain('procedure_declaration');
      expect(result).not.toContain('ERROR');
    });

    test('Nested function in procedure should parse without errors', () => {
      const sql = `
        PROCEDURE Outer_Proc___ IS
          FUNCTION Inner_Func___ RETURN NUMBER IS
          BEGIN
            RETURN 42;
          END Inner_Func___;
        BEGIN
          IF Inner_Func___ > 0 THEN
            NULL;
          END IF;
        END Outer_Proc___;
      `;

      const result = expectParseSuccess(sql, 'Nested function in procedure should parse successfully');
      expect(result).toContain('procedure_declaration');
      expect(result).toContain('function_declaration');
      expect(result).not.toContain('ERROR');
    });

    test('Function with nested function should parse without errors', () => {
      const sql = `
        FUNCTION Outer_Func___ RETURN NUMBER IS
          FUNCTION Inner_Func___ RETURN NUMBER IS
          BEGIN
            RETURN 10;
          END Inner_Func___;
        BEGIN
          RETURN Inner_Func___ * 2;
        END Outer_Func___;
      `;

      const result = expectParseSuccess(sql, 'Function with nested function should parse successfully');
      expect(result).toContain('function_declaration');
      expect(result).not.toContain('ERROR');
    });

    test('Multiple nested procedures should parse without errors', () => {
      const sql = `
        PROCEDURE Outer_Proc___ IS
          PROCEDURE Inner_Proc1___ IS
          BEGIN
            NULL;
          END Inner_Proc1___;
          
          PROCEDURE Inner_Proc2___ IS
          BEGIN
            NULL;
          END Inner_Proc2___;
        BEGIN
          Inner_Proc1___;
          Inner_Proc2___;
        END Outer_Proc___;
      `;

      const result = expectParseSuccess(sql, 'Multiple nested procedures should parse successfully');
      expect(result).toContain('procedure_declaration');
      expect(result).not.toContain('ERROR');
    });
  });

  describe('Complex nested scenarios', () => {
    test('Deeply nested procedures and functions should parse without errors', () => {
      const sql = `
        PROCEDURE Level1_Proc___ IS
          PROCEDURE Level2_Proc___ IS
            FUNCTION Level3_Func___ RETURN VARCHAR2 IS
            BEGIN
              RETURN 'nested';
            END Level3_Func___;
          BEGIN
            IF Level3_Func___ = 'nested' THEN
              NULL;
            END IF;
          END Level2_Proc___;
          
          FUNCTION Level2_Func___ RETURN BOOLEAN IS
          BEGIN
            RETURN TRUE;
          END Level2_Func___;
        BEGIN
          Level2_Proc___;
          IF Level2_Func___ THEN
            NULL;
          END IF;
        END Level1_Proc___;
      `;

      const result = expectParseSuccess(sql, 'Deeply nested procedures and functions should parse successfully');
      expect(result).toContain('procedure_declaration');
      expect(result).toContain('function_declaration');
      expect(result).not.toContain('ERROR');
    });

    test('Package body with nested procedures should parse without errors', () => {
      const sql = `
        PACKAGE BODY Test_Package IS
          PROCEDURE Public_Proc___ IS
            PROCEDURE Private_Nested___ IS
            BEGIN
              NULL;
            END Private_Nested___;
          BEGIN
            Private_Nested___;
          END Public_Proc___;
          
          FUNCTION Public_Func___ RETURN NUMBER IS
            FUNCTION Private_Func___ RETURN NUMBER IS
            BEGIN
              RETURN 42;
            END Private_Func___;
          BEGIN
            RETURN Private_Func___ * 2;
          END Public_Func___;
        END Test_Package;
      `;

      const result = expectParseSuccess(sql, 'Package body with nested procedures should parse successfully');
      expect(result).toContain('package_body');
      expect(result).toContain('procedure_declaration');
      expect(result).toContain('function_declaration');
      expect(result).not.toContain('ERROR');
    });

    test('Anonymous block with nested procedure should parse without errors', () => {
      const sql = `
        DECLARE
          PROCEDURE Local_Proc___ IS
          BEGIN
            NULL;
          END Local_Proc___;
        BEGIN
          Local_Proc___;
        END;
      `;

      const result = expectParseSuccess(sql, 'Anonymous block with nested procedure should parse successfully');
      expect(result).toContain('anonymous_block');
      expect(result).toContain('procedure_declaration');
      expect(result).not.toContain('ERROR');
    });
  });

  describe('Error cases for nested procedures', () => {
    test('SHOULD FAIL: Incomplete nested procedure', () => {
      const sql = `
        PROCEDURE Outer_Proc___ IS
          PROCEDURE Inner_Proc___
        BEGIN
          NULL;
        END Outer_Proc___;
      `;

      expect(() => {
        parseSQL(sql);
      }).toThrow();
    });

    test('SHOULD FAIL: Missing END for nested procedure', () => {
      const sql = `
        PROCEDURE Outer_Proc___ IS
          PROCEDURE Inner_Proc___ IS
          BEGIN
            NULL;
        BEGIN
          NULL;
        END Outer_Proc___;
      `;

      expect(() => {
        parseSQL(sql);
      }).toThrow();
    });
  });
});
