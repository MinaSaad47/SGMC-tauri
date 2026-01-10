use std::sync::LazyLock;

use tauri::plugin::TauriPlugin;
use tauri_plugin_sql::{Migration, MigrationKind};

use crate::filesystem;

fn db_migrations() -> Vec<Migration> {
    vec![Migration {
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
    }]
}

pub static DB_URL: LazyLock<String> = LazyLock::new(|| {
    let db = filesystem::DATA_DIR.join("database.db");
    format!("sqlite:{}", db.display())
});

pub fn get_db_plugin<R>() -> TauriPlugin<R, Option<tauri_plugin_sql::PluginConfig>>
where
    R: tauri::Runtime,
{
    tauri_plugin_sql::Builder::new()
        .add_migrations(&DB_URL, db_migrations())
        .build()
}
