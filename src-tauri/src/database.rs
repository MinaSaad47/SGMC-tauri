use std::sync::LazyLock;

use tauri::plugin::TauriPlugin;
use tauri_plugin_sql::{Migration, MigrationKind};

use crate::filesystem;

fn db_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            kind: MigrationKind::Up,
            description: "initial_schema",
            sql: r#"
            CREATE TABLE IF NOT EXISTS patients (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT NOT NULL UNIQUE,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients (phone);

            CREATE TABLE IF NOT EXISTS statements (
                id TEXT PRIMARY KEY,
                patient_id TEXT NOT NULL,
                total INTEGER NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY(patient_id) REFERENCES patients(id)
            );
            CREATE INDEX IF NOT EXISTS idx_statements_patient_id ON statements (patient_id);

            CREATE TABLE IF NOT EXISTS payments (
                id TEXT PRIMARY KEY,
                statement_id TEXT NOT NULL,
                amount INTEGER NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY(statement_id) REFERENCES statements(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_payments_statement_id ON payments (statement_id);

            CREATE TABLE sessions (
                id TEXT PRIMARY KEY,
                statement_id TEXT NOT NULL,
                procedure TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY(statement_id) REFERENCES statements(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_sessions_statement_id ON sessions (statement_id);
        "#,
        },
        Migration {
            version: 2,
            kind: MigrationKind::Up,
            description: "add_doctors_and_clinics",
            sql: r#"
            CREATE TABLE IF NOT EXISTS doctors (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS clinics (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );

            ALTER TABLE statements ADD COLUMN doctor_id TEXT REFERENCES doctors(id) ON DELETE SET NULL;
            ALTER TABLE statements ADD COLUMN clinic_id TEXT REFERENCES clinics(id) ON DELETE SET NULL;
            
            CREATE INDEX IF NOT EXISTS idx_statements_doctor_id ON statements (doctor_id);
            CREATE INDEX IF NOT EXISTS idx_statements_clinic_id ON statements (clinic_id);
        "#,
        },
        Migration {
            version: 3,
            kind: MigrationKind::Up,
            description: "cascade_delete_patients",
            sql: r#"
            CREATE TABLE statements_new (
                id TEXT PRIMARY KEY,
                patient_id TEXT NOT NULL,
                total INTEGER NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                doctor_id TEXT,
                clinic_id TEXT,
                FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE,
                FOREIGN KEY(doctor_id) REFERENCES doctors(id) ON DELETE SET NULL,
                FOREIGN KEY(clinic_id) REFERENCES clinics(id) ON DELETE SET NULL
            );

            INSERT INTO statements_new (id, patient_id, total, created_at, updated_at, doctor_id, clinic_id)
            SELECT id, patient_id, total, created_at, updated_at, doctor_id, clinic_id FROM statements;

            DROP TABLE statements;
            ALTER TABLE statements_new RENAME TO statements;

            CREATE INDEX IF NOT EXISTS idx_statements_patient_id ON statements (patient_id);
            CREATE INDEX IF NOT EXISTS idx_statements_doctor_id ON statements (doctor_id);
            CREATE INDEX IF NOT EXISTS idx_statements_clinic_id ON statements (clinic_id);
        "#,
        },
    ]
}

pub static DB_PATH: LazyLock<String> = LazyLock::new(|| {
    filesystem::DATA_DIR
        .join("database.db")
        .display()
        .to_string()
});

pub static DB_URL: LazyLock<String> = LazyLock::new(|| format!("sqlite:{}", *DB_PATH));

pub fn get_db_plugin<R>() -> TauriPlugin<R, Option<tauri_plugin_sql::PluginConfig>>
where
    R: tauri::Runtime,
{
    tauri_plugin_sql::Builder::new()
        .add_migrations(&DB_URL, db_migrations())
        .build()
}

/// Tauri command to get the database URL
#[tauri::command]
pub fn get_db_url() -> String {
    DB_URL.clone()
}

/// Tauri command to get the database path
#[tauri::command]
pub fn get_db_path() -> String {
    DB_PATH.clone()
}
