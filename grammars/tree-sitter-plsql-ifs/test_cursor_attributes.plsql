-- Test cursor attributes
DECLARE
   CURSOR c1 IS SELECT * FROM employees;
   v_count NUMBER;
BEGIN
   OPEN c1;
   
   IF c1%ISOPEN THEN
      NULL;
   END IF;
   
   FETCH c1 INTO v_emp;
   IF c1%FOUND THEN
      DBMS_OUTPUT.PUT_LINE('Record found');
   END IF;
   
   IF c1%NOTFOUND THEN
      EXIT;
   END IF;
   
   v_count := c1%ROWCOUNT;
   
   -- SQL cursor attributes
   UPDATE employees SET salary = 1000;
   IF SQL%FOUND THEN
      COMMIT;
   END IF;
   
   v_count := SQL%ROWCOUNT;
   
   CLOSE c1;
END;
