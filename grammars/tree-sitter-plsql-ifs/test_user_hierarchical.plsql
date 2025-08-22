select level x,
party, orig_recp, ref_recp, orig_amt, ref_amt
from my_level1
where party between 'A0001' AND 'A0003'
connect by
prior orig_recp = ref_recp and
prior party = party
start with ref_recp is null;
