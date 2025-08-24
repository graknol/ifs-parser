const GrammarTester = require('./grammar-tester');

describe('Debug Record Field Access', () => {
  let tester;

  beforeAll(() => {
    tester = new GrammarTester();
  });

  afterAll(() => {
    if (tester) {
      tester.cleanup();
    }
  });

  test('record field access without arrays', () => {
    const sql = `
      DECLARE
        TYPE employee_rec IS RECORD (
          id NUMBER,
          name VARCHAR2(100)
        );
        
        temp_emp employee_rec;
      BEGIN
        temp_emp.name := 'John';
        DBMS_OUTPUT.PUT_LINE(temp_emp.name);
      END;
    `;

    const result = tester.parseCode(sql);
    if (!result.success) {
      console.log('Parse error details:', result.error);
    }
    expect(result.success).toBe(true);
  });

  test('array element access without record fields', () => {
    const sql = `
      DECLARE
        TYPE str_array IS TABLE OF VARCHAR2(100) INDEX BY BINARY_INTEGER;
        names str_array;
      BEGIN
        names(1) := 'John';
        DBMS_OUTPUT.PUT_LINE(names(1));
      END;
    `;

    const result = tester.parseCode(sql);
    if (!result.success) {
      console.log('Parse error details:', result.error);
    }
    expect(result.success).toBe(true);
  });

  test('combining array access with record field access', () => {
    const sql = `
      DECLARE
        TYPE employee_rec IS RECORD (
          name VARCHAR2(100)
        );
        
        TYPE emp_array IS TABLE OF employee_rec INDEX BY BINARY_INTEGER;
        
        employees emp_array;
        temp_emp employee_rec;
      BEGIN
        temp_emp.name := 'John';
        employees(1) := temp_emp;
        -- This line should work: accessing field of array element
        DBMS_OUTPUT.PUT_LINE(employees(1).name);
      END;
    `;

    const result = tester.parseCode(sql);
    if (!result.success) {
      console.log('Parse error details:', result.error);
      console.log('This is the problematic syntax: employees(1).name');
    }
    expect(result.success).toBe(true);
  });
});
