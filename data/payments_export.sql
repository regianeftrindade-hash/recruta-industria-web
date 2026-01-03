-- SQLite import for payments
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  externalId TEXT,
  amount INTEGER,
  currency TEXT,
  method TEXT,
  customer TEXT,
  status TEXT,
  meta TEXT,
  createdAt TEXT,
  updatedAt TEXT
);
INSERT OR REPLACE INTO payments (id, externalId, amount, currency, method, customer, status, meta, createdAt, updatedAt) VALUES (
'473af627-c688-45c1-91a6-2a366f59b327', NULL, 1990, 'BRL', 'pix', '{"email":"a@b.com","name":"Teste"}', 'PAID', '{}', '2025-12-31T16:03:58.481Z', '2025-12-31T16:09:40.618Z'
);
COMMIT;
