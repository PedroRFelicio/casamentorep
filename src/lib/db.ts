import { Pool } from "pg";

const globalForDb = globalThis as unknown as { pool?: Pool; schemaReady?: boolean };

function buildConnectionString() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;

  // Remove sslmode from URL and control SSL via driver options below.
  const url = new URL(raw);
  url.searchParams.delete("sslmode");
  return url.toString();
}

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: buildConnectionString(),
    ssl: { rejectUnauthorized: false }
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export async function ensureSchema() {
  if (globalForDb.schemaReady) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS guest (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      adults INTEGER NOT NULL DEFAULT 1,
      children INTEGER NOT NULL DEFAULT 0,
      children_under_or_equal_6 INTEGER NOT NULL DEFAULT 0,
      children_over_6 INTEGER NOT NULL DEFAULT 0,
      will_attend BOOLEAN NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS message (
      id SERIAL PRIMARY KEY,
      author_name TEXT NOT NULL,
      email TEXT,
      content TEXT NOT NULL,
      approved BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS gift (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT NOT NULL,
      price_cents INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS gift_order (
      id SERIAL PRIMARY KEY,
      buyer_name TEXT NOT NULL,
      buyer_email TEXT,
      message TEXT,
      total_cents INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pendente',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS gift_order_item (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES gift_order(id) ON DELETE CASCADE,
      gift_id INTEGER NOT NULL REFERENCES gift(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_cents INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'gift_order' AND column_name = 'payment_status'
      ) THEN
        ALTER TABLE gift_order ADD COLUMN payment_status TEXT;
        UPDATE gift_order SET payment_status = 'paid' WHERE payment_status IS NULL;
        ALTER TABLE gift_order ALTER COLUMN payment_status SET NOT NULL;
        ALTER TABLE gift_order ALTER COLUMN payment_status SET DEFAULT 'awaiting_couple';
      END IF;
    END $$;
  `);

  globalForDb.schemaReady = true;
}
