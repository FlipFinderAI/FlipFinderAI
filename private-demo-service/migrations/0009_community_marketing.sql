-- Marketing consent is separate from Community membership.
-- Contact details may remain after Community deletion only where
-- valid continuing consent or a justified suppression requirement exists.

CREATE TABLE community_marketing_contacts (
  id TEXT PRIMARY KEY,
  account_id TEXT UNIQUE,
  email_normalized TEXT,
  phone_e164 TEXT,
  email_sms_consent INTEGER NOT NULL DEFAULT 0
    CHECK(email_sms_consent IN (0,1)),
  consent_recorded_at INTEGER,
  consent_withdrawn_at INTEGER,
  consent_source TEXT,
  consent_version TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(account_id)
    REFERENCES community_accounts(id)
    ON DELETE SET NULL
);

CREATE INDEX community_marketing_contacts_email
ON community_marketing_contacts(email_normalized);

CREATE INDEX community_marketing_contacts_phone
ON community_marketing_contacts(phone_e164);
