-- limited_state_id invullen voor de automatisch ingedeelde limited subedities.
-- Alleen rijen met status auto in limited-states-voorstel.csv; de andere blijven leeg.
-- Vereist dat Named Edition al in limited_states staat.
begin;

-- Artist: 12 rijen
update public.sub_editions
set limited_state_id = (select id from public.limited_states where name = 'Artist')
where is_limited_edition = true
  and limited_state_id is null
  and id in (198, 227, 246, 249, 341, 352, 360, 405, 410, 423, 427, 7760);

-- Lettered: 73 rijen
update public.sub_editions
set limited_state_id = (select id from public.limited_states where name = 'Lettered')
where is_limited_edition = true
  and limited_state_id is null
  and id in (206, 596, 6646, 7319, 7466, 7470, 7482, 7502, 7572, 7589, 7616, 7618, 7648, 7655, 7657, 7664, 7671, 7691, 7704, 7707, 7709, 7727, 7731, 7737, 7741, 7749, 7751, 7761, 7780, 7784, 7790, 7796, 7798, 7803, 7818, 7822, 7824, 7843, 7852, 7858, 7881, 7883, 7887, 7901, 7907, 7909, 7912, 7915, 7932, 7934, 7942, 7946, 7948, 7951, 7953, 7959, 7978, 7980, 7982, 7986, 7995, 7997, 7999, 8004, 8022, 8024, 8035, 8037, 8048, 8054, 8056, 8058, 8074);

-- Limited: 117 rijen
update public.sub_editions
set limited_state_id = (select id from public.limited_states where name = 'Limited')
where is_limited_edition = true
  and limited_state_id is null
  and id in (95, 966, 1553, 1598, 1784, 3382, 3385, 3388, 3391, 3394, 3397, 3400, 3403, 3406, 3409, 3412, 3415, 3418, 3421, 3424, 3427, 3430, 3433, 3436, 3439, 3442, 3445, 3448, 3451, 3454, 3457, 3460, 3463, 3466, 3469, 3472, 3475, 3478, 3481, 3484, 3487, 3490, 3493, 5160, 7053, 7066, 7071, 7090, 7106, 7136, 7320, 7328, 7330, 7332, 7334, 7336, 7385, 7387, 7392, 7394, 7426, 7428, 7457, 7459, 7461, 7463, 7501, 7534, 7540, 7541, 7571, 7595, 7716, 7743, 7759, 7773, 7779, 7805, 7829, 7830, 7847, 7873, 7879, 7885, 7889, 7899, 7905, 7914, 7929, 7930, 7957, 7969, 7989, 7993, 8002, 8006, 8010, 8012, 8014, 8018, 8026, 8028, 8041, 8046, 8050, 8052, 8060, 8062, 8066, 8068, 8070, 8072, 8078, 8080, 8082, 8084, 8086);

-- Named Edition: 18 rijen
update public.sub_editions
set limited_state_id = (select id from public.limited_states where name = 'Named Edition')
where is_limited_edition = true
  and limited_state_id is null
  and id in (855, 856, 857, 858, 859, 860, 861, 862, 863, 864, 865, 866, 868, 869, 871, 872, 875, 876);

-- Numbered: 88 rijen
update public.sub_editions
set limited_state_id = (select id from public.limited_states where name = 'Numbered')
where is_limited_edition = true
  and limited_state_id is null
  and id in (183, 185, 188, 190, 607, 622, 1887, 2090, 2406, 2457, 5268, 5569, 5583, 6645, 6763, 7051, 7166, 7183, 7197, 7199, 7465, 7469, 7481, 7570, 7580, 7588, 7615, 7617, 7647, 7650, 7654, 7656, 7663, 7670, 7690, 7703, 7706, 7708, 7726, 7730, 7736, 7740, 7748, 7750, 7783, 7789, 7795, 7797, 7802, 7817, 7821, 7823, 7842, 7851, 7857, 7880, 7882, 7900, 7906, 7908, 7911, 7917, 7918, 7931, 7933, 7941, 7945, 7947, 7950, 7952, 7958, 7977, 7979, 7981, 7985, 7994, 7996, 7998, 8003, 8021, 8023, 8034, 8036, 8047, 8053, 8055, 8057, 8073);

-- Standard: 5 rijen
update public.sub_editions
set limited_state_id = (select id from public.limited_states where name = 'Standard')
where is_limited_edition = true
  and limited_state_id is null
  and id in (338, 609, 610, 2089, 7577);

commit;
