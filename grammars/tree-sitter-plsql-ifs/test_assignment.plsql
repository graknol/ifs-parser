layer Core;

PROCEDURE Test IS
   newrec activity_tab%ROWTYPE;
BEGIN
   newrec.activity_no := 123;
   newrec.project_id := 'PROJ001';
END Test;
