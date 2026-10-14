-- Private registration details for Community supporters.
-- Existing accounts remain valid without these details.
-- Phone numbers are collected without SMS verification.
-- Phone contact discovery requires separate opt-in consent.

CREATE TABLE community_signup_details (
  account_id TEXT PRIMARY KEY
    REFERENCES community_accounts(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  surname TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CHECK(length(trim(first_name)) BETWEEN 1 AND 80),
  CHECK(length(trim(surname)) BETWEEN 1 AND 80),
  CHECK(length(phone_e164) BETWEEN 8 AND 16),
  CHECK(phone_e164 GLOB '+[0-9]*'),
  CHECK(phone_e164 NOT GLOB '*[^+0-9]*')
);

CREATE INDEX community_signup_details_phone
ON community_signup_details(phone_e164);
