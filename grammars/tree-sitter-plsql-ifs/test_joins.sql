-- Test file for various JOIN types and implicit joins

-- Basic implicit joins (comma-separated FROM clause)
SELECT * FROM table1, table2 WHERE table1.id = table2.id;

-- Basic explicit joins that should work
SELECT * FROM table1 JOIN table2 ON table1.id = table2.id;
SELECT * FROM table1 INNER JOIN table2 ON table1.id = table2.id;
SELECT * FROM table1 LEFT JOIN table2 ON table1.id = table2.id;
SELECT * FROM table1 RIGHT JOIN table2 ON table1.id = table2.id;
SELECT * FROM table1 FULL JOIN table2 ON table1.id = table2.id;

-- Oracle-style OUTER JOIN variations that might not work
SELECT * FROM table1 LEFT OUTER JOIN table2 ON table1.id = table2.id;
SELECT * FROM table1 RIGHT OUTER JOIN table2 ON table1.id = table2.id;
SELECT * FROM table1 FULL OUTER JOIN table2 ON table1.id = table2.id;

-- CROSS JOIN (Cartesian product)
SELECT * FROM table1 CROSS JOIN table2;

-- APPLY operations (SQL Server style, might not be in Oracle)
SELECT * FROM table1 CROSS APPLY (SELECT * FROM table2 WHERE table2.id = table1.id);
SELECT * FROM table1 OUTER APPLY (SELECT * FROM table2 WHERE table2.id = table1.id);

-- Multiple joins
SELECT * FROM 
    table1 t1
    JOIN table2 t2 ON t1.id = t2.id
    LEFT JOIN table3 t3 ON t2.id = t3.id
    RIGHT OUTER JOIN table4 t4 ON t3.id = t4.id;
