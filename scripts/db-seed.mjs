import bcrypt from "bcryptjs";
import { connect } from "./_db.mjs";

const PASSWORD = "Demo123!";

const USERS = [
  ["ADMIN", "Admin", "admin@novaworks.example", "ADMIN", "Administrator", ["Company overview", "transcript creation"]],
  ["PM01", "Ayesha Khan", "ayesha@novaworks.example", "MANAGER", "Web PM", ["Web projects", "client coordination"]],
  ["PM02", "Bilal Ahmed", "bilal@novaworks.example", "MANAGER", "Mobile PM", ["Mobile projects", "delivery planning"]],
  ["PM03", "Hina Malik", "hina@novaworks.example", "MANAGER", "AI PM", ["AI projects", "requirement review"]],
  ["DEV01", "Ali Raza", "ali@novaworks.example", "AGENT", "Full-Stack", ["React", "frontend integration"]],
  ["DEV02", "Hamza Shah", "hamza@novaworks.example", "AGENT", "Full-Stack", ["Node.js", "databases", "APIs"]],
  ["DEV03", "Sara Noor", "sara@novaworks.example", "AGENT", "App Developer", ["Flutter", "mobile UI"]],
  ["DEV04", "Usman Tariq", "usman@novaworks.example", "AGENT", "App Developer", ["Flutter", "integration", "testing"]],
  ["DEV05", "Zain Abbas", "zain@novaworks.example", "AGENT", "AI Developer", ["LLMs", "extraction", "prompts"]],
  ["DEV06", "Maryam Asif", "maryam@novaworks.example", "AGENT", "AI Developer", ["Retrieval", "document processing"]],
];

const hash = await bcrypt.hash(PASSWORD, 10);
const client = connect();
await client.connect();
try {
  for (const [id, name, email, role, specialization, skills] of USERS) {
    await client.query(
      `INSERT INTO users (id, name, email, password_hash, role, specialization, skills)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name, password_hash = EXCLUDED.password_hash,
         role = EXCLUDED.role, specialization = EXCLUDED.specialization,
         skills = EXCLUDED.skills`,
      [id, name, email, hash, role, specialization, skills],
    );
  }
  console.log(`Seeded ${USERS.length} users.`);
} finally {
  await client.end();
}
