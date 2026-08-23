-- Promote the very first-created user to admin, but only if no admin
-- exists yet. Every user defaults to role=customer, so without this
-- there would be nobody able to reach the new admin-only /manage tooling.
UPDATE "users" SET "role" = 'admin'
WHERE "id" = (SELECT "id" FROM "users" ORDER BY "created_at" ASC LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM "users" WHERE "role" = 'admin');
