layer Core;

PROCEDURE Update_Cache___ (
   company_ IN VARCHAR2,
   code_part_value_ IN VARCHAR2 )
IS
   req_id_     VARCHAR2(1000) := company_||'^'||code_part_value_;
   null_value_ Public_Rec;
   time_       NUMBER;
   expired_    BOOLEAN;
BEGIN
   time_    := Database_SYS.Get_Time_Offset;
   expired_ := ((time_ - micro_cache_time_) > max_cached_element_life_);
   IF (expired_ OR (micro_cache_user_ IS NULL) OR (micro_cache_user_ != Fnd_Session_API.Get_Fnd_User)) THEN
      Invalidate_Cache___;
      micro_cache_user_ := Fnd_Session_API.Get_Fnd_User;
   END IF;
   IF (NOT micro_cache_tab_.exists(req_id_)) THEN
      SELECT company, code_part_value,
             rowid, rowversion
      INTO  micro_cache_value_.company,
            micro_cache_value_.code_part_value,
            micro_cache_value_.rowid,
            micro_cache_value_.rowversion
      FROM  accounting_code_part_value_tab
      WHERE company = company_
      AND   code_part_value = code_part_value_
      AND   code_part = 'A';
      
      micro_cache_tab_(req_id_) := micro_cache_value_;
      micro_cache_time_ := time_;
   END IF;
   micro_cache_value_ := micro_cache_tab_(req_id_);
EXCEPTION
   WHEN no_data_found THEN
      micro_cache_value_ := null_value_;
      micro_cache_time_  := time_;
END Update_Cache___;
