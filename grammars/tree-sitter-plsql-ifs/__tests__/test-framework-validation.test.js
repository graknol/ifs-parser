const GrammarTester = require('./grammar-tester');

describe('Test Framework Validation', () => {
  let tester;

  beforeAll(() => {
    tester = new GrammarTester();
  });

  afterAll(() => {
    if (tester) {
      tester.cleanup();
    }
  });

  describe('Framework Sanity Checks', () => {
    test('Verify tester can detect successful parse', () => {
      const result = tester.parseCode('SELECT 1 FROM dual;');
      expect(result.success).toBe(true);
      expect(result.hasErrors).toBe(false);
      expect(result.errors).toHaveLength(0);
      expect(result.output).toContain('source_file');
    });

    test('Verify tester can detect parse failure', () => {
      const result = tester.parseCode('INVALID SQL SYNTAX HERE');
      expect(result.success).toBe(false);
      expect(result.hasErrors).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('Verify output contains tree structure', () => {
      const result = tester.parseCode('SELECT name FROM users;');
      expect(result.output).toContain('source_file');
      expect(result.output).toContain('select_statement');
      expect(result.success).toBe(true);
    });

    test('Verify error reporting works', () => {
      const result = tester.parseCode('SELECT FROM;'); // Missing column list
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.output).toContain('ERROR');
    });
  });

  describe('Grammar Coverage Verification', () => {
    test('Simple statements work', () => {
      const tests = [
        'SELECT 1 FROM dual;',
        'SELECT * FROM table1;',
        'SELECT col1, col2 FROM table1;',
        'SELECT * FROM table1 WHERE id = 1;'
      ];

      tests.forEach(sql => {
        const result = tester.parseCode(sql);
        expect(result.success).toBe(true);
      });
    });

    test('JOIN functionality works', () => {
      const tests = [
        'SELECT * FROM t1 JOIN t2 ON t1.id = t2.id;',
        'SELECT * FROM t1 LEFT JOIN t2 ON t1.id = t2.id;',
        'SELECT * FROM t1 CROSS JOIN t2;',
        'SELECT * FROM t1 CROSS APPLY (SELECT * FROM t2);'
      ];

      tests.forEach(sql => {
        const result = tester.parseCode(sql);
        expect(result.success).toBe(true);
      });
    });

    test('Basic expressions work', () => {
      const tests = [
        'SELECT 1 + 2 FROM dual;',
        'SELECT a * b FROM table1;',
        "SELECT 'hello' || 'world' FROM dual;",
        'SELECT CASE WHEN 1=1 THEN 1 ELSE 0 END FROM dual;'
      ];

      tests.forEach(sql => {
        const result = tester.parseCode(sql);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Error Detection Validation', () => {
    test('Syntax errors are properly caught', () => {
      const invalidSqlTests = [
        'SELECT',           // Incomplete
        'FROM WHERE;',      // Wrong order
        'SELECT * FRM;',    // Typo in keyword
        'SELECT ((();',     // Unmatched parens
        'SELECT "unclosed'  // Unclosed quote
      ];

      invalidSqlTests.forEach(sql => {
        const result = tester.parseCode(sql);
        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });
});
