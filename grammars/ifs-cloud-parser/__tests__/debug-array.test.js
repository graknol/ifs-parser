const GrammarTester = require('./grammar-tester');

describe('Debug Array Types', () => {
  let tester;

  beforeAll(() => {
    tester = new GrammarTester();
  });

  afterAll(() => {
    if (tester) {
      tester.cleanup();
    }
  });

  test('simple table type declaration', () => {
    const sql = `
      DECLARE
        TYPE employee_rec IS RECORD (
          id NUMBER,
          name VARCHAR2(100)
        );
        
        TYPE employee_array IS TABLE OF employee_rec INDEX BY BINARY_INTEGER;
      BEGIN
        NULL;
      END;
    `;

    const result = tester.parseCode(sql);
    if (!result.success) {
      console.log('Parse error details:', result.error);
      console.log('Parse tree:', result.ast);
    }
    expect(result.success).toBe(true);
  });

  test('minimal table type', () => {
    const sql = `
      DECLARE
        TYPE test_array IS TABLE OF NUMBER INDEX BY BINARY_INTEGER;
      BEGIN
        NULL;
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
