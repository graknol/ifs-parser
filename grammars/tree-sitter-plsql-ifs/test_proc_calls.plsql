layer Core;

PROCEDURE Clear_Closed_Date___ (
   attr_ IN OUT VARCHAR2,
   rec_  IN     activity_tab%ROWTYPE)
IS
   objid_       VARCHAR2(50);
   objversion_  VARCHAR2(260);  
   newrec_      activity_tab%ROWTYPE;
BEGIN
   Get_Id_Version_By_Keys___(objid_, objversion_, newrec_.activity_seq);
   Unpack___(newrec_, indrec_, attr_);
   Check_Update___(rec_, newrec_, indrec_, attr_);
   NULL;
END Clear_Closed_Date___;
