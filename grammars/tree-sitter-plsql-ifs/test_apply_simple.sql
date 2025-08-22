-- Test basic CROSS APPLY with uppercase
SELECT * FROM table1 CROSS APPLY (SELECT * FROM table2);
