layer Core;

CURSOR Get_Activities (project_id_  VARCHAR2,
                       key_         VARCHAR2) RETURN activity_tab%ROWTYPE IS
   SELECT *
   FROM   activity_tab;

text_separator_ CONSTANT VARCHAR2(1) := Client_SYS.text_separator_;
