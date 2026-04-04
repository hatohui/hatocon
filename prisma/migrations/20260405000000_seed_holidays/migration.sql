-- Seed Vietnam and Singapore Public Holidays
-- Solar holidays use isRecurring=true with a base date of 2000
-- Lunar holidays have specific dates pre-computed for 2025-2030

-- ═══════════════════════════════════════════════════════════════
-- VIETNAM SOLAR HOLIDAYS (recurring)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO "Holiday" (id, date, description, country, "isGlobal", "isRecurring", "isLunar", "lunarMonth", "lunarDay")
VALUES
  (gen_random_uuid(), '2000-01-01', 'New Year''s Day', 'VN', false, true, false, NULL, NULL),
  (gen_random_uuid(), '2000-04-30', 'Reunification Day', 'VN', false, true, false, NULL, NULL),
  (gen_random_uuid(), '2000-05-01', 'Labour Day', 'VN', false, true, false, NULL, NULL),
  (gen_random_uuid(), '2000-09-02', 'National Day', 'VN', false, true, false, NULL, NULL),
  (gen_random_uuid(), '2000-09-03', 'National Day Holiday', 'VN', false, true, false, NULL, NULL);

-- ═══════════════════════════════════════════════════════════════
-- VIETNAM LUNAR HOLIDAYS (pre-computed for 2025-2030)
-- Tết: Lunar 12/30(eve), 1/1, 1/2, 1/3, 1/4
-- Hung Kings: Lunar 3/10
-- ═══════════════════════════════════════════════════════════════

-- 2025 Tết (Lunar New Year: Jan 29, 2025)
INSERT INTO "Holiday" (id, date, description, country, "isGlobal", "isRecurring", "isLunar", "lunarMonth", "lunarDay") VALUES
  (gen_random_uuid(), '2025-01-28', 'Tết (Lunar New Year''s Eve)', 'VN', false, false, true, 12, 30),
  (gen_random_uuid(), '2025-01-29', 'Tết (Lunar New Year Day 1)', 'VN', false, false, true, 1, 1),
  (gen_random_uuid(), '2025-01-30', 'Tết (Lunar New Year Day 2)', 'VN', false, false, true, 1, 2),
  (gen_random_uuid(), '2025-01-31', 'Tết (Lunar New Year Day 3)', 'VN', false, false, true, 1, 3),
  (gen_random_uuid(), '2025-02-01', 'Tết (Lunar New Year Day 4)', 'VN', false, false, true, 1, 4),
  (gen_random_uuid(), '2025-04-07', 'Hung Kings'' Festival', 'VN', false, false, true, 3, 10);

-- 2026 Tết (Lunar New Year: Feb 17, 2026)
INSERT INTO "Holiday" (id, date, description, country, "isGlobal", "isRecurring", "isLunar", "lunarMonth", "lunarDay") VALUES
  (gen_random_uuid(), '2026-02-16', 'Tết (Lunar New Year''s Eve)', 'VN', false, false, true, 12, 30),
  (gen_random_uuid(), '2026-02-17', 'Tết (Lunar New Year Day 1)', 'VN', false, false, true, 1, 1),
  (gen_random_uuid(), '2026-02-18', 'Tết (Lunar New Year Day 2)', 'VN', false, false, true, 1, 2),
  (gen_random_uuid(), '2026-02-19', 'Tết (Lunar New Year Day 3)', 'VN', false, false, true, 1, 3),
  (gen_random_uuid(), '2026-02-20', 'Tết (Lunar New Year Day 4)', 'VN', false, false, true, 1, 4),
  (gen_random_uuid(), '2026-03-28', 'Hung Kings'' Festival', 'VN', false, false, true, 3, 10);

-- 2027 Tết (Lunar New Year: Feb 6, 2027)
INSERT INTO "Holiday" (id, date, description, country, "isGlobal", "isRecurring", "isLunar", "lunarMonth", "lunarDay") VALUES
  (gen_random_uuid(), '2027-02-05', 'Tết (Lunar New Year''s Eve)', 'VN', false, false, true, 12, 30),
  (gen_random_uuid(), '2027-02-06', 'Tết (Lunar New Year Day 1)', 'VN', false, false, true, 1, 1),
  (gen_random_uuid(), '2027-02-07', 'Tết (Lunar New Year Day 2)', 'VN', false, false, true, 1, 2),
  (gen_random_uuid(), '2027-02-08', 'Tết (Lunar New Year Day 3)', 'VN', false, false, true, 1, 3),
  (gen_random_uuid(), '2027-02-09', 'Tết (Lunar New Year Day 4)', 'VN', false, false, true, 1, 4),
  (gen_random_uuid(), '2027-03-18', 'Hung Kings'' Festival', 'VN', false, false, true, 3, 10);

-- 2028 Tết (Lunar New Year: Jan 26, 2028)
INSERT INTO "Holiday" (id, date, description, country, "isGlobal", "isRecurring", "isLunar", "lunarMonth", "lunarDay") VALUES
  (gen_random_uuid(), '2028-01-25', 'Tết (Lunar New Year''s Eve)', 'VN', false, false, true, 12, 30),
  (gen_random_uuid(), '2028-01-26', 'Tết (Lunar New Year Day 1)', 'VN', false, false, true, 1, 1),
  (gen_random_uuid(), '2028-01-27', 'Tết (Lunar New Year Day 2)', 'VN', false, false, true, 1, 2),
  (gen_random_uuid(), '2028-01-28', 'Tết (Lunar New Year Day 3)', 'VN', false, false, true, 1, 3),
  (gen_random_uuid(), '2028-01-29', 'Tết (Lunar New Year Day 4)', 'VN', false, false, true, 1, 4),
  (gen_random_uuid(), '2028-04-05', 'Hung Kings'' Festival', 'VN', false, false, true, 3, 10);

-- 2029 Tết (Lunar New Year: Feb 13, 2029)
INSERT INTO "Holiday" (id, date, description, country, "isGlobal", "isRecurring", "isLunar", "lunarMonth", "lunarDay") VALUES
  (gen_random_uuid(), '2029-02-12', 'Tết (Lunar New Year''s Eve)', 'VN', false, false, true, 12, 30),
  (gen_random_uuid(), '2029-02-13', 'Tết (Lunar New Year Day 1)', 'VN', false, false, true, 1, 1),
  (gen_random_uuid(), '2029-02-14', 'Tết (Lunar New Year Day 2)', 'VN', false, false, true, 1, 2),
  (gen_random_uuid(), '2029-02-15', 'Tết (Lunar New Year Day 3)', 'VN', false, false, true, 1, 3),
  (gen_random_uuid(), '2029-02-16', 'Tết (Lunar New Year Day 4)', 'VN', false, false, true, 1, 4),
  (gen_random_uuid(), '2029-03-25', 'Hung Kings'' Festival', 'VN', false, false, true, 3, 10);

-- 2030 Tết (Lunar New Year: Feb 3, 2030)
INSERT INTO "Holiday" (id, date, description, country, "isGlobal", "isRecurring", "isLunar", "lunarMonth", "lunarDay") VALUES
  (gen_random_uuid(), '2030-02-02', 'Tết (Lunar New Year''s Eve)', 'VN', false, false, true, 12, 30),
  (gen_random_uuid(), '2030-02-03', 'Tết (Lunar New Year Day 1)', 'VN', false, false, true, 1, 1),
  (gen_random_uuid(), '2030-02-04', 'Tết (Lunar New Year Day 2)', 'VN', false, false, true, 1, 2),
  (gen_random_uuid(), '2030-02-05', 'Tết (Lunar New Year Day 3)', 'VN', false, false, true, 1, 3),
  (gen_random_uuid(), '2030-02-06', 'Tết (Lunar New Year Day 4)', 'VN', false, false, true, 1, 4),
  (gen_random_uuid(), '2030-03-15', 'Hung Kings'' Festival', 'VN', false, false, true, 3, 10);

-- ═══════════════════════════════════════════════════════════════
-- SINGAPORE SOLAR HOLIDAYS (recurring)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO "Holiday" (id, date, description, country, "isGlobal", "isRecurring", "isLunar", "lunarMonth", "lunarDay")
VALUES
  (gen_random_uuid(), '2000-01-01', 'New Year''s Day', 'SG', false, true, false, NULL, NULL),
  (gen_random_uuid(), '2000-05-01', 'Labour Day', 'SG', false, true, false, NULL, NULL),
  (gen_random_uuid(), '2000-08-09', 'National Day', 'SG', false, true, false, NULL, NULL),
  (gen_random_uuid(), '2000-12-25', 'Christmas Day', 'SG', false, true, false, NULL, NULL);

-- ═══════════════════════════════════════════════════════════════
-- SINGAPORE LUNAR HOLIDAYS (pre-computed for 2025-2030)
-- Chinese New Year: Lunar 1/1, 1/2
-- Vesak Day: Lunar 4/15
-- ═══════════════════════════════════════════════════════════════

-- 2025
INSERT INTO "Holiday" (id, date, description, country, "isGlobal", "isRecurring", "isLunar", "lunarMonth", "lunarDay") VALUES
  (gen_random_uuid(), '2025-01-29', 'Chinese New Year Day 1', 'SG', false, false, true, 1, 1),
  (gen_random_uuid(), '2025-01-30', 'Chinese New Year Day 2', 'SG', false, false, true, 1, 2),
  (gen_random_uuid(), '2025-05-12', 'Vesak Day', 'SG', false, false, true, 4, 15);

-- Singapore non-lunar variable holidays (Hari Raya, Good Friday, Deepavali — dates vary yearly)
-- 2025
INSERT INTO "Holiday" (id, date, description, country, "isGlobal", "isRecurring", "isLunar", "lunarMonth", "lunarDay") VALUES
  (gen_random_uuid(), '2025-03-31', 'Hari Raya Puasa', 'SG', false, false, false, NULL, NULL),
  (gen_random_uuid(), '2025-04-18', 'Good Friday', 'SG', false, false, false, NULL, NULL),
  (gen_random_uuid(), '2025-06-07', 'Hari Raya Haji', 'SG', false, false, false, NULL, NULL),
  (gen_random_uuid(), '2025-10-20', 'Deepavali', 'SG', false, false, false, NULL, NULL);

-- 2026
INSERT INTO "Holiday" (id, date, description, country, "isGlobal", "isRecurring", "isLunar", "lunarMonth", "lunarDay") VALUES
  (gen_random_uuid(), '2026-02-17', 'Chinese New Year Day 1', 'SG', false, false, true, 1, 1),
  (gen_random_uuid(), '2026-02-18', 'Chinese New Year Day 2', 'SG', false, false, true, 1, 2),
  (gen_random_uuid(), '2026-05-01', 'Vesak Day', 'SG', false, false, true, 4, 15),
  (gen_random_uuid(), '2026-03-20', 'Hari Raya Puasa', 'SG', false, false, false, NULL, NULL),
  (gen_random_uuid(), '2026-04-03', 'Good Friday', 'SG', false, false, false, NULL, NULL),
  (gen_random_uuid(), '2026-05-27', 'Hari Raya Haji', 'SG', false, false, false, NULL, NULL),
  (gen_random_uuid(), '2026-11-08', 'Deepavali', 'SG', false, false, false, NULL, NULL);

-- 2027
INSERT INTO "Holiday" (id, date, description, country, "isGlobal", "isRecurring", "isLunar", "lunarMonth", "lunarDay") VALUES
  (gen_random_uuid(), '2027-02-06', 'Chinese New Year Day 1', 'SG', false, false, true, 1, 1),
  (gen_random_uuid(), '2027-02-07', 'Chinese New Year Day 2', 'SG', false, false, true, 1, 2),
  (gen_random_uuid(), '2027-05-20', 'Vesak Day', 'SG', false, false, true, 4, 15),
  (gen_random_uuid(), '2027-03-10', 'Hari Raya Puasa', 'SG', false, false, false, NULL, NULL),
  (gen_random_uuid(), '2027-03-26', 'Good Friday', 'SG', false, false, false, NULL, NULL),
  (gen_random_uuid(), '2027-05-17', 'Hari Raya Haji', 'SG', false, false, false, NULL, NULL),
  (gen_random_uuid(), '2027-10-29', 'Deepavali', 'SG', false, false, false, NULL, NULL);

-- 2028
INSERT INTO "Holiday" (id, date, description, country, "isGlobal", "isRecurring", "isLunar", "lunarMonth", "lunarDay") VALUES
  (gen_random_uuid(), '2028-01-26', 'Chinese New Year Day 1', 'SG', false, false, true, 1, 1),
  (gen_random_uuid(), '2028-01-27', 'Chinese New Year Day 2', 'SG', false, false, true, 1, 2),
  (gen_random_uuid(), '2028-05-09', 'Vesak Day', 'SG', false, false, true, 4, 15),
  (gen_random_uuid(), '2028-02-28', 'Hari Raya Puasa', 'SG', false, false, false, NULL, NULL),
  (gen_random_uuid(), '2028-04-14', 'Good Friday', 'SG', false, false, false, NULL, NULL),
  (gen_random_uuid(), '2028-05-06', 'Hari Raya Haji', 'SG', false, false, false, NULL, NULL),
  (gen_random_uuid(), '2028-10-17', 'Deepavali', 'SG', false, false, false, NULL, NULL);

-- 2029
INSERT INTO "Holiday" (id, date, description, country, "isGlobal", "isRecurring", "isLunar", "lunarMonth", "lunarDay") VALUES
  (gen_random_uuid(), '2029-02-13', 'Chinese New Year Day 1', 'SG', false, false, true, 1, 1),
  (gen_random_uuid(), '2029-02-14', 'Chinese New Year Day 2', 'SG', false, false, true, 1, 2),
  (gen_random_uuid(), '2029-05-27', 'Vesak Day', 'SG', false, false, true, 4, 15),
  (gen_random_uuid(), '2029-02-15', 'Hari Raya Puasa', 'SG', false, false, false, NULL, NULL),
  (gen_random_uuid(), '2029-03-30', 'Good Friday', 'SG', false, false, false, NULL, NULL),
  (gen_random_uuid(), '2029-04-25', 'Hari Raya Haji', 'SG', false, false, false, NULL, NULL),
  (gen_random_uuid(), '2029-11-05', 'Deepavali', 'SG', false, false, false, NULL, NULL);

-- 2030
INSERT INTO "Holiday" (id, date, description, country, "isGlobal", "isRecurring", "isLunar", "lunarMonth", "lunarDay") VALUES
  (gen_random_uuid(), '2030-02-03', 'Chinese New Year Day 1', 'SG', false, false, true, 1, 1),
  (gen_random_uuid(), '2030-02-04', 'Chinese New Year Day 2', 'SG', false, false, true, 1, 2),
  (gen_random_uuid(), '2030-05-16', 'Vesak Day', 'SG', false, false, true, 4, 15),
  (gen_random_uuid(), '2030-02-04', 'Hari Raya Puasa', 'SG', false, false, false, NULL, NULL),
  (gen_random_uuid(), '2030-04-19', 'Good Friday', 'SG', false, false, false, NULL, NULL),
  (gen_random_uuid(), '2030-04-14', 'Hari Raya Haji', 'SG', false, false, false, NULL, NULL),
  (gen_random_uuid(), '2030-10-26', 'Deepavali', 'SG', false, false, false, NULL, NULL);
