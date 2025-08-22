PROCEDURE Test_Math_And_Like_Simple IS
   result NUMBER;
   name VARCHAR2(100);
BEGIN
   -- Mathematical operators
   result := 10 + 5 - 3;
   result := 4 * 8 / 2;
   result := 17 MOD 5;
   result := 2 ** 3;
   
   -- LIKE with ESCAPE clause (simple cases)
   SELECT name 
   INTO name
   FROM employees 
   WHERE name LIKE 'test_%' ESCAPE '_';
   
   SELECT COUNT(*)
   INTO result
   FROM products 
   WHERE product_code LIKE 'ABC%DEF' ESCAPE '\'
     AND description LIKE '%discount%';
   
   -- LIKE without ESCAPE
   SELECT COUNT(*)
   INTO result
   FROM customers
   WHERE customer_name LIKE '%Smith%'
     AND customer_name NOT LIKE 'John%';

END Test_Math_And_Like_Simple;
