import { client } from "./client";

/**
 * Ensures all required database tables and indexes exist before any queries or seeds run.
 * Safe and idempotent on fresh and existing SQLite / LibSQL databases.
 */
export async function ensureTablesExist(): Promise<void> {
  // 1. Profiles (No FK dependencies)
  await client.execute(`
    CREATE TABLE IF NOT EXISTS profiles (
      id text PRIMARY KEY NOT NULL,
      name text NOT NULL,
      email text,
      role text NOT NULL,
      class_id text,
      created_at text NOT NULL
    );
  `);

  // 2. Tasks (FK to profiles)
  await client.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id text PRIMARY KEY NOT NULL,
      title text NOT NULL,
      subject text NOT NULL,
      description text NOT NULL,
      created_by text,
      created_at text NOT NULL,
      FOREIGN KEY (created_by) REFERENCES profiles(id) ON UPDATE NO ACTION ON DELETE NO ACTION
    );
  `);

  // 3. Missions (FK to tasks, profiles)
  await client.execute(`
    CREATE TABLE IF NOT EXISTS missions (
      id text PRIMARY KEY NOT NULL,
      task_id text NOT NULL,
      student_id text NOT NULL,
      instruction text NOT NULL,
      dimensions text NOT NULL,
      status text DEFAULT 'active' NOT NULL,
      created_at text NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
      FOREIGN KEY (student_id) REFERENCES profiles(id) ON UPDATE NO ACTION ON DELETE NO ACTION
    );
  `);

  // 4. Events (FK to profiles, tasks)
  await client.execute(`
    CREATE TABLE IF NOT EXISTS events (
      id text PRIMARY KEY NOT NULL,
      student_id text NOT NULL,
      task_id text,
      type text NOT NULL,
      source text NOT NULL,
      metadata text NOT NULL,
      created_at text NOT NULL,
      FOREIGN KEY (student_id) REFERENCES profiles(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON UPDATE NO ACTION ON DELETE NO ACTION
    );
  `);

  await client.execute(`CREATE INDEX IF NOT EXISTS events_student_id_idx ON events (student_id);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS events_task_id_idx ON events (task_id);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS events_created_at_idx ON events (created_at);`);

  // 5. Evidence (FK to profiles, tasks)
  await client.execute(`
    CREATE TABLE IF NOT EXISTS evidence (
      id text PRIMARY KEY NOT NULL,
      student_id text NOT NULL,
      task_id text,
      dimension text NOT NULL,
      rule_id text NOT NULL,
      summary text NOT NULL,
      supporting_event_ids text NOT NULL,
      strength text NOT NULL,
      created_at text NOT NULL,
      FOREIGN KEY (student_id) REFERENCES profiles(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON UPDATE NO ACTION ON DELETE NO ACTION
    );
  `);

  await client.execute(`CREATE INDEX IF NOT EXISTS evidence_student_id_idx ON evidence (student_id);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS evidence_dimension_idx ON evidence (dimension);`);
}
