-- Test multiple annotations on procedures and functions
@Override
@UncheckedAccess
PROCEDURE Test_Multiple_Annotations IS
BEGIN
   NULL;
END Test_Multiple_Annotations;

@Overtake
@Override
FUNCTION Get_Value RETURN NUMBER IS
BEGIN
   RETURN 42;
END Get_Value;

-- Single annotation should still work
@Override
PROCEDURE Single_Annotation IS
BEGIN
   NULL;
END Single_Annotation;

-- No annotations should still work
PROCEDURE No_Annotation IS
BEGIN
   NULL;
END No_Annotation;

-- Test with all three annotations
@Override
@Overtake
@UncheckedAccess
FUNCTION All_Annotations RETURN BOOLEAN IS
BEGIN
   RETURN TRUE;
END All_Annotations;
