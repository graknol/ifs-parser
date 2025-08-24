const GrammarTester = require('./grammar-tester');

describe('Debug Array Access', () => {
  let tester;

  beforeAll(() => {
    tester = new GrammarTester();
  });

  afterAll(() => {
    if (tester) {
      tester.cleanup();
    }
  });

  test('array element access', () => {
    const sql = `
      DECLARE
        TYPE employee_rec IS RECORD (
          id NUMBER,
          name VARCHAR2(100),
          salary NUMBER
        );
        
        TYPE employee_array IS TABLE OF employee_rec INDEX BY BINARY_INTEGER;
        
        employees employee_array;
        temp_emp employee_rec;
      BEGIN
        -- Test array element assignment
        temp_emp.id := 1;
        temp_emp.name := 'John';
        temp_emp.salary := 50000;
        employees(1) := temp_emp;
        
        -- Test array element access
        DBMS_OUTPUT.PUT_LINE(employees(1).name);
      END;
    `;

    const result = tester.parseCode(sql);
    if (!result.success) {
      console.log('Parse error details:', result.error);
      console.log('Parse tree:', result.ast);
    }
    expect(result.success).toBe(true);
  });

  test('simple array access', () => {
    const sql = `
      DECLARE
        TYPE num_array IS TABLE OF NUMBER INDEX BY BINARY_INTEGER;
        numbers num_array;
      BEGIN
        numbers(1) := 100;
        DBMS_OUTPUT.PUT_LINE(numbers(1));
      END;
    `;

    const result = tester.parseCode(sql);
    if (!result.success) {
      console.log('Parse error details:', result.error);
      console.log('Parse tree:', result.ast);
    }
    expect(result.success).toBe(true);
  });
});
