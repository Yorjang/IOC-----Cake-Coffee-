const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: { rejectUnauthorized: false }
  });
  
  await client.connect();
  console.log('Connected.');

  const triggers = await client.query(`
    SELECT 
      event_object_table AS table_name,
      trigger_name,
      action_statement AS definition
    FROM information_schema.triggers
  `);
  console.log("Database Triggers:", triggers.rows);

  const functions = await client.query(`
    SELECT routine_name, routine_definition 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
  `);
  for (const fn of functions.rows) {
    if (fn.routine_definition && fn.routine_definition.includes("stock")) {
      console.log(`Function: ${fn.routine_name}\nDefinition:\n${fn.routine_definition}\n`);
    }
  }

  await client.end();
}

run().catch(console.error);
