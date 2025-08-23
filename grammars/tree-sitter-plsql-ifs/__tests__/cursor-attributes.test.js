const GrammarTester = require('./grammar-tester');

describe('Cursor Attributes', () => {
  let tester;

  beforeAll(() => {
    tester = new GrammarTester();
  });

  afterAll(() => {
    if (tester) {
      tester.cleanup();
    }
  });

  describe('Basic cursor attributes', () => {
    test('cursor %FOUND attribute', () => {
      const sql = `
        BEGIN
          OPEN my_cursor;
          FETCH my_cursor INTO emp_rec;
          IF my_cursor%FOUND THEN
            DBMS_OUTPUT.PUT_LINE('Record found');
          END IF;
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('cursor %NOTFOUND attribute', () => {
      const sql = `
        BEGIN
          FETCH emp_cursor INTO emp_rec;
          IF emp_cursor%NOTFOUND THEN
            EXIT;
          END IF;
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('cursor %ROWCOUNT attribute', () => {
      const sql = `
        BEGIN
          FOR emp IN emp_cursor LOOP
            process_employee(emp);
            IF emp_cursor%ROWCOUNT > 1000 THEN
              EXIT;
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

    test('cursor %ISOPEN attribute', () => {
      const sql = `
        BEGIN
          IF NOT emp_cursor%ISOPEN THEN
            OPEN emp_cursor;
          END IF;
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

  describe('Cursor attributes in complex expressions', () => {
    test('cursor attributes in loop conditions', () => {
      const sql = `
        BEGIN
          LOOP
            FETCH all_activities_sub INTO activity_rec;
            EXIT WHEN all_activities_sub%NOTFOUND;
            
            process_activity(activity_rec);
            
            IF all_activities_sub%ROWCOUNT MOD 100 = 0 THEN
              COMMIT;
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

    test('cursor attributes with qualified cursor names', () => {
      const sql = `
        BEGIN
          IF (is_sub_project_manager%FOUND) THEN
            manager_found := TRUE;
          END IF;
          
          IF check_project_id_exists%FOUND THEN
            project_exists := TRUE;
          END IF;
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('cursor attributes in procedure calls', () => {
      const sql = `
        BEGIN
          FETCH get_reserved_details_ INTO reservation_rec;
          IF (get_reserved_details_%FOUND) THEN
            Process_Reservation(reservation_rec);
          END IF;
          
          Log_Cursor_Status(get_reserved_details_%ROWCOUNT);
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('multiple cursor attributes in expressions', () => {
      const sql = `
        BEGIN
          IF emp_cursor%FOUND AND emp_cursor%ROWCOUNT > 0 THEN
            DBMS_OUTPUT.PUT_LINE('Processing ' || emp_cursor%ROWCOUNT || ' records');
          END IF;
          
          WHILE dept_cursor%ISOPEN AND dept_cursor%FOUND LOOP
            FETCH dept_cursor INTO dept_rec;
            EXIT WHEN dept_cursor%NOTFOUND;
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

  describe('SQL cursor attributes', () => {
    test('SQL%FOUND for DML statements', () => {
      const sql = `
        BEGIN
          UPDATE employees SET salary = salary * 1.1 WHERE department_id = 10;
          IF SQL%FOUND THEN
            DBMS_OUTPUT.PUT_LINE('Employees updated: ' || SQL%ROWCOUNT);
          END IF;
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('SQL%NOTFOUND and SQL%ROWCOUNT', () => {
      const sql = `
        BEGIN
          DELETE FROM employees WHERE status = 'INACTIVE';
          IF SQL%NOTFOUND THEN
            DBMS_OUTPUT.PUT_LINE('No inactive employees found');
          ELSE
            DBMS_OUTPUT.PUT_LINE('Deleted ' || SQL%ROWCOUNT || ' employees');
          END IF;
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

  describe('Real-world cursor attribute usage', () => {
    test('cursor attribute in IFS-style code', () => {
      const sql = `
        PROCEDURE Process_Purchase_Orders IS
          CURSOR get_line_count IS
            SELECT COUNT(*) FROM purchase_order_lines;
          line_count NUMBER;
        BEGIN
          OPEN get_line_count;
          FETCH get_line_count INTO line_count;
          IF (get_line_count%NOTFOUND) THEN
            Error_SYS.Record_General('PurchaseOrder', 'NOLINES: No lines found');
          END IF;
          CLOSE get_line_count;
          
          IF check_lines%FOUND THEN
            Process_Lines();
          END IF;
        END Process_Purchase_Orders;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('cursor attribute with underscore-suffix names', () => {
      const sql = `
        BEGIN
          FETCH get_reserved_details_ INTO reservation_data;
          IF (get_reserved_details_%FOUND) THEN
            reserved_amount_ := reservation_data.amount;
          END IF;
          
          IF lines_exist%NOTFOUND THEN
            Create_Default_Line();
          END IF;
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
