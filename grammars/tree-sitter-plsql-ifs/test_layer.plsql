-- Test layer declaration
layer Core;

-- Test cursor
CURSOR Get_Activities (project_id_  VARCHAR2,
                       key_         VARCHAR2) IS
   SELECT *
   FROM   activity_tab
   WHERE  project_id = project_id_
   AND    node_type  = 'ACTIVITY';
