-- Test APPLY operations
SELECT * FROM table1 CROSS APPLY (SELECT * FROM table2 WHERE table2.id = table1.id);
SELECT * FROM table1 OUTER APPLY (SELECT * FROM table2 WHERE table2.id = table1.id);
