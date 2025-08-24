const GrammarTester = require('./grammar-tester');

describe('Empty Declaration Blocks', () => {
  let tester;

  beforeAll(() => {
    tester = new GrammarTester();
  });

  afterAll(() => {
    if (tester) {
      tester.cleanup();
    }
  });

  describe('Functions with empty declaration blocks', () => {
    test('Function with no declarations between IS and BEGIN', () => {
      const sql = `
        FUNCTION Get_Value RETURN NUMBER IS
        BEGIN
          RETURN 42;
        END Get_Value;
      `;
      
      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('Function with parameters and no declarations', () => {
      const sql = `
        FUNCTION Calculate(x NUMBER, y NUMBER) RETURN NUMBER IS
        BEGIN
          RETURN x + y;
        END Calculate;
      `;
      
      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('Function within package body with no declarations', () => {
      const sql = `
        PACKAGE BODY Test_Package IS
          FUNCTION Get_Count RETURN NUMBER IS
          BEGIN
            RETURN 0;
          END Get_Count;
        END Test_Package;
      `;
      
      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });
  });

  describe('Procedures with empty declaration blocks', () => {
    test('Procedure with no declarations between IS and BEGIN', () => {
      const sql = `
        PROCEDURE Process_Data IS
        BEGIN
          NULL;
        END Process_Data;
      `;
      
      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('Procedure with parameters and no declarations', () => {
      const sql = `
        PROCEDURE Update_Status(id NUMBER, status VARCHAR2) IS
        BEGIN
          UPDATE table_name SET status_col = status WHERE id_col = id;
        END Update_Status;
      `;
      
      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });
  });
});
