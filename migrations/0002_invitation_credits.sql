CREATE TABLE invitations (
  code_hash TEXT PRIMARY KEY,
  credits_total INTEGER NOT NULL CHECK(credits_total BETWEEN 1 AND 100),
  credits_remaining INTEGER NOT NULL CHECK(credits_remaining >= 0),
  expires_at INTEGER NOT NULL,
  revoked INTEGER NOT NULL DEFAULT 0 CHECK(revoked IN (0,1))
);
CREATE TABLE invite_sessions (
  session_hash TEXT PRIMARY KEY,
  invitation_hash TEXT NOT NULL REFERENCES invitations(code_hash),
  expires_at INTEGER NOT NULL
);
CREATE INDEX invite_sessions_expiry ON invite_sessions(expires_at);
CREATE TABLE share_receipts (
  invitation_hash TEXT NOT NULL,
  request_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  PRIMARY KEY(invitation_hash,request_id)
);
CREATE INDEX share_receipts_expiry ON share_receipts(expires_at);
ALTER TABLE gifts ADD COLUMN invitation_hash TEXT;
ALTER TABLE gifts ADD COLUMN request_id TEXT;
ALTER TABLE gifts ADD COLUMN payload_hash TEXT;
-- One gift insertion, credit deduction and receipt are a single SQL transaction.
-- A receipt prevents a retry resurrecting a gift that was already opened/deleted.
CREATE TRIGGER gift_credit_guard BEFORE INSERT ON gifts
WHEN NEW.invitation_hash IS NOT NULL
BEGIN
  SELECT CASE WHEN EXISTS(SELECT 1 FROM share_receipts WHERE invitation_hash=NEW.invitation_hash AND request_id=NEW.request_id) THEN RAISE(IGNORE) END;
  SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM invitations WHERE code_hash=NEW.invitation_hash AND revoked=0 AND expires_at>unixepoch() AND credits_remaining>0) THEN RAISE(ABORT,'invitation_unavailable') END;
END;
CREATE TRIGGER gift_credit_spend AFTER INSERT ON gifts
WHEN NEW.invitation_hash IS NOT NULL
BEGIN
  UPDATE invitations SET credits_remaining=credits_remaining-1 WHERE code_hash=NEW.invitation_hash;
  INSERT INTO share_receipts VALUES(NEW.invitation_hash,NEW.request_id,NEW.token_hash,NEW.payload_hash,NEW.expires_at);
  INSERT INTO metrics(day,event,count) VALUES(date('now'),'share_created',1) ON CONFLICT(day,event) DO UPDATE SET count=count+1;
  INSERT INTO metrics(day,event,count) VALUES(date('now'),'credit_spent',1) ON CONFLICT(day,event) DO UPDATE SET count=count+1;
END;
