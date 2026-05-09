import pool from './db.js';

export async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS profiles (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255),
      age INTEGER,
      gender VARCHAR(10),
      height NUMERIC(5,2),
      weight NUMERIC(5,2),
      activity_level VARCHAR(20),
      goal VARCHAR(20),
      openai_api_key TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS weight_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      weight NUMERIC(5,2) NOT NULL,
      UNIQUE(user_id, date)
    );

    CREATE TABLE IF NOT EXISTS food_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      meal_type VARCHAR(10) NOT NULL,
      name VARCHAR(255) NOT NULL,
      calories INTEGER NOT NULL,
      protein NUMERIC(6,2) DEFAULT 0,
      carbs NUMERIC(6,2) DEFAULT 0,
      fat NUMERIC(6,2) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS exercise_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      name VARCHAR(255) NOT NULL,
      duration INTEGER NOT NULL,
      calories INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('Database migration complete');
}
