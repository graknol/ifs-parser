layer Core;

-------------------- PRIVATE DECLARATIONS -----------------------------------

text_separator_                CONSTANT VARCHAR2(1) := Client_SYS.text_separator_;

state_separator_               CONSTANT VARCHAR2(1) := Client_SYS.field_separator_;

FUNCTION Generate_Activity_Seq___ RETURN NUMBER
IS
   w_activity_seq_  NUMBER;
BEGIN
   RETURN w_activity_seq_;
END Generate_Activity_Seq___;
