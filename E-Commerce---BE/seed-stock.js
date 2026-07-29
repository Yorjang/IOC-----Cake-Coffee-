const { Client } = require('pg');

const client = new Client({
  host: 'aws-1-ap-northeast-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.nkhdmjcsmeeulhcynbul',
  password: 'QmmpBMvb0xpAFUbQ',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log("Connected to DB");

  const branches = [
    '33255cc5-ac61-42e4-8fbb-48b80e32321d',
    '2091d087-3cc6-4656-b116-c98b87fa4367',
    '36b17393-d5fe-42c6-b00a-1ebbeef9508d'
  ];

  const { rows: variants } = await client.query('SELECT id FROM product_variants');
  console.log(`Found ${variants.length} variants`);

  let count = 0;
  for (const branch of branches) {
    for (const variant of variants) {
      await client.query(`
        INSERT INTO branch_variant_stocks (branch_id, variant_id, quantity)
        VALUES ($1, $2, 1000)
        ON CONFLICT (branch_id, variant_id) DO UPDATE SET quantity = 1000;
      `, [branch, variant.id]);
      count++;
    }
  }

  console.log(`Seeded ${count} stock records successfully.`);
  await client.end();
}

run().catch(console.error);
