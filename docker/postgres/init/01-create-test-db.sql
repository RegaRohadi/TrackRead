-- Dedicated database for the test suite. Tests wipe this database, so they
-- must never point at the application database.
SELECT 'CREATE DATABASE trackread_test OWNER "' || current_user || '"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'trackread_test')\gexec
