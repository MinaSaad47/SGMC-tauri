import { v7 as uuid } from "uuid";
import { getDb } from "./db";

const PATIENTS = [
  { name: "John Doe", phone: "+1234567890" },
  { name: "Jane Smith", phone: "+0987654321" },
  { name: "أحمد محمد", phone: "+201000000000" }, // Arabic name
  { name: "Long Name Person With Many Middle Names And A Very Long Last Name", phone: "+111222333" },
  { name: "No Phone Person", phone: "" },
  { name: "Dr. House", phone: "555-1234" },
];

const PROCEDURES = [
  "Consultation",
  "X-Ray",
  "Blood Test",
  "MRI Scan",
  "Surgery",
  "Follow-up",
  "فحص طبي", // Arabic procedure
  "Emergency",
];

export async function seedDatabase() {
  const db = await getDb();
  console.log("Seeding database...");

  // 1. Create Patients
  const patientIds: string[] = [];
  for (const p of PATIENTS) {
    const id = uuid();
    patientIds.push(id);
    await db.execute(
      "INSERT INTO patients (id, name, phone, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))",
      [id, p.name, p.phone]
    );
  }

  // 2. Create Statements & Related Data for each patient
  for (const patientId of patientIds) {
    // Case 1: Unpaid Statement
    await createFullStatement(db, patientId, 50000, 0, 2); // 500.00 total, 0 paid

    // Case 2: Fully Paid Statement
    await createFullStatement(db, patientId, 15000, 15000, 1); // 150.00 total, 150.00 paid

    // Case 3: Partially Paid Statement
    await createFullStatement(db, patientId, 100000, 25000, 3); // 1000.00 total, 250.00 paid

    // Case 4: Overpaid Statement (Negative Remaining)
    await createFullStatement(db, patientId, 20000, 25000, 1); // 200.00 total, 250.00 paid

    // Case 5: Zero Total Statement
    await createFullStatement(db, patientId, 0, 0, 1);

    // Case 6: Large Amount Statement
    await createFullStatement(db, patientId, 100000000, 5000000, 5); // 1,000,000.00 total
  }

  console.log("Database seeded successfully!");
}

async function createFullStatement(
  db: any,
  patientId: string,
  total: number,
  paidAmount: number,
  sessionCount: number
) {
  const statementId = uuid();

  // Create Statement
  await db.execute(
    "INSERT INTO statements (id, patient_id, total, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))",
    [statementId, patientId, total]
  );

  // Add Sessions
  for (let i = 0; i < sessionCount; i++) {
    const sessionId = uuid();
    const procedure = PROCEDURES[Math.floor(Math.random() * PROCEDURES.length)];
    await db.execute(
      "INSERT INTO sessions (id, statement_id, \"procedure\", created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))",
      [sessionId, statementId, procedure]
    );
  }

  // Add Payment (if any)
  if (paidAmount > 0) {
    const paymentId = uuid();
    await db.execute(
      "INSERT INTO payments (id, statement_id, amount, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))",
      [paymentId, statementId, paidAmount]
    );
  }
}
