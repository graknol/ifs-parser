-----------------------------------------------------------------------------
--
--  Logical unit: Project
--  Component:    PROJ
--
--  IFS Developer Studio Template Version 3.0
--
--  Date   Sign   History
--  ------ ------ ---------------------------------------------------------
--  220406 DIMULK PJDEV-5432, Removed PLAN_PROJECT_TRANSACTION_DB from the attr in Copy_Project_Attr___.
--  210614 JanaLk PJ21R2-352, Added Mandatory Invoice comment on Project level
--  210601 KETKLK PJ21R2-749, Removed PDMPRO references.
--  201204 DWANLK IP2020R1-267, Added Get_Proj_Fin_Detail_Lobby function which is used in Industries project functional lobbies.
--  200123 ISLILK Bug PJZ-3598, Modified Copy_Project_Attr___ to set the correct destination_sub_project_id when copying Projects and Sub_Projects
--  240120 CHRALK Bug PJZ-3721, Modified method Insert___() method by adding correctionand info message to remove apaces before the project id.
-----------------------------------------------------------------------------

layer Core;

-------------------- PUBLIC DECLARATIONS ------------------------------------


-------------------- PRIVATE DECLARATIONS -----------------------------------

date_time_format_                CONSTANT VARCHAR2(30) := 'fmMonth DD, YYYY';

-------------------- LU SPECIFIC IMPLEMENTATION METHODS ---------------------


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
