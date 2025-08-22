layer Core;

PROCEDURE Simple_Test IS
   expired_ BOOLEAN;
BEGIN
   expired_ := (micro_cache_time_ > max_cached_element_life_);
   IF expired_ THEN
      NULL;
   END IF;
END Simple_Test;
