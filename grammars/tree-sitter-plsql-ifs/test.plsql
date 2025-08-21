@Override
FUNCTION Get_Baseline_Revision_Number (
   project_id_ IN VARCHAR2 ) RETURN NUMBER
IS
   baseline_revision_number_     project_tab.baseline_revision_number%TYPE;
BEGIN
   baseline_revision_number_ := super(project_id_);
   
   IF (baseline_revision_number_ IS NULL) THEN
      RETURN 0;
   ELSE
      RETURN baseline_revision_number_;
   END IF;
END Get_Baseline_Revision_Number;

PROCEDURE Approve_Action___ (
   rec_  IN OUT project_tab%ROWTYPE,
   attr_ IN OUT VARCHAR2 )
IS
   newrec_ project_tab%ROWTYPE;
BEGIN
   newrec_ := rec_;
   Finite_State_Set___(newrec_, 'Approved');
   Update___(newrec_, rec_, attr_, objid_, objversion_, TRUE);
END Approve_Action___;
