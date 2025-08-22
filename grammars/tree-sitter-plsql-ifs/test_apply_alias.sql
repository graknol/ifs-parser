-- Test APPLY with alias
SELECT * FROM table1 t1 
CROSS APPLY (SELECT * FROM table2 WHERE table2.id = t1.id) AS ca;
