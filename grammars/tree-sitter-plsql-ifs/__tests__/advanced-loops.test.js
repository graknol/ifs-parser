const GrammarTester = require('./grammar-tester');

describe('Advanced Loop Constructs', () => {
  let tester;

  beforeAll(() => {
    tester = new GrammarTester();
  });

  afterAll(() => {
    if (tester) {
      tester.cleanup();
    }
  });

  describe('REVERSE loops', () => {
    test('simple REVERSE loop', () => {
      const sql = `
        BEGIN
          FOR i IN REVERSE 1..10 LOOP
            DBMS_OUTPUT.PUT_LINE(i);
          END LOOP;
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('REVERSE loop with variables', () => {
      const sql = `
        DECLARE
          start_val NUMBER := 1;
          end_val NUMBER := 100;
        BEGIN
          FOR counter IN REVERSE start_val..end_val LOOP
            Process_Item(counter);
          END LOOP;
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('nested REVERSE and normal loops', () => {
      const sql = `
        BEGIN
          FOR outer IN 1..5 LOOP
            FOR inner IN REVERSE 10..15 LOOP
              DBMS_OUTPUT.PUT_LINE('Outer: ' || outer || ', Inner: ' || inner);
            END LOOP;
          END LOOP;
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('REVERSE loop with expressions', () => {
      const sql = `
        DECLARE
          max_count NUMBER := Get_Max_Count();
        BEGIN
          FOR idx IN REVERSE (max_count - 10)..(max_count + 10) LOOP
            IF idx MOD 2 = 0 THEN
              Process_Even(idx);
            ELSE
              Process_Odd(idx);
            END IF;
          END LOOP;
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });
  });

  describe('Regular FOR loops (should still work)', () => {
    test('normal FOR loop', () => {
      const sql = `
        BEGIN
          FOR i IN 1..10 LOOP
            DBMS_OUTPUT.PUT_LINE(i);
          END LOOP;
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('cursor FOR loop', () => {
      const sql = `
        BEGIN
          FOR emp_rec IN (SELECT * FROM employees WHERE active = 'Y') LOOP
            Process_Employee(emp_rec);
          END LOOP;
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('cursor FOR loop with named cursor', () => {
      const sql = `
        DECLARE
          CURSOR emp_cursor IS SELECT * FROM employees;
        BEGIN
          FOR emp_rec IN emp_cursor LOOP
            UPDATE employees SET last_accessed = SYSDATE 
            WHERE employee_id = emp_rec.employee_id;
          END LOOP;
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });
  });

  describe('Complex loop scenarios', () => {
    test('REVERSE loop in procedure', () => {
      const sql = `
        PROCEDURE Process_Items_Reverse IS
        BEGIN
          -- Process items in reverse order for cleanup
          FOR item_id IN REVERSE 1..Get_Max_Item_Id() LOOP
            Cleanup_Item(item_id);
            
            -- Early exit if cleanup fails
            IF NOT Item_Cleanup_Success(item_id) THEN
              EXIT;
            END IF;
          END LOOP;
        END Process_Items_Reverse;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('mixed loop types with labels', () => {
      const sql = `
        BEGIN
          <<outer_loop>>
          FOR batch IN 1..10 LOOP
            <<inner_reverse>>
            FOR item IN REVERSE (batch * 100)..(batch * 100 + 99) LOOP
              Process_Item(batch, item);
              
              -- Exit inner loop if needed
              EXIT inner_reverse WHEN item < batch * 100 + 50;
            END LOOP inner_reverse;
            
            -- Continue outer loop
            CONTINUE outer_loop WHEN batch < 5;
          END LOOP outer_loop;
        END;
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
