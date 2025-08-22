PROCEDURE Test_Math_And_Like IS
   result NUMBER;
   name VARCHAR2(100);
BEGIN
   -- Mathematical operators
   result := 10 + 5;
   result := 10 - 3;
   result := 4 * 8;
   result := 20 / 4;
   result := 17 MOD 5;
   result := 2 ** 3;  -- Power operator
   
   -- Complex mathematical expressions
   result := (10 + 5) * 2 - 3;
   result := 100 / (4 + 1) + 2 * 3;
   
   -- LIKE with ESCAPE clause
   SELECT name 
   INTO name
   FROM employees 
   WHERE name LIKE 'some \_ literal' ESCAPE '\';
   
   -- More LIKE with ESCAPE examples
   SELECT COUNT(*)
   INTO result
   FROM products 
   WHERE product_code LIKE 'ABC\%DEF' ESCAPE '\'
     AND description LIKE '%50\% discount%' ESCAPE '\';
   
   -- LIKE without ESCAPE
   SELECT COUNT(*)
   INTO result
   FROM customers
   WHERE customer_name LIKE '%Smith%'
     AND customer_name NOT LIKE 'John_%';

END Test_Math_And_Like;
