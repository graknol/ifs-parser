-- Test supported JOIN types
SELECT * FROM table1, table2 WHERE table1.id = table2.id;
SELECT * FROM table1 JOIN table2 ON table1.id = table2.id;
SELECT * FROM table1 INNER JOIN table2 ON table1.id = table2.id;
SELECT * FROM table1 LEFT JOIN table2 ON table1.id = table2.id;
SELECT * FROM table1 LEFT OUTER JOIN table2 ON table1.id = table2.id;
SELECT * FROM table1 RIGHT JOIN table2 ON table1.id = table2.id;
SELECT * FROM table1 RIGHT OUTER JOIN table2 ON table1.id = table2.id;
SELECT * FROM table1 FULL JOIN table2 ON table1.id = table2.id;
SELECT * FROM table1 FULL OUTER JOIN table2 ON table1.id = table2.id;
SELECT * FROM table1 CROSS JOIN table2;
SELECT * FROM table1 CROSS APPLY (SELECT * FROM table2 WHERE table2.id = table1.id);
SELECT * FROM table1 OUTER APPLY (SELECT * FROM table2 WHERE table2.id = table1.id);
