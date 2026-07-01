import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '../db';
import { clients } from '../db/schema';
import { createSquareClient } from '../services/square/SquareClient';

async function run() {
  const [row] = await db.select().from(clients);
  const sq = createSquareClient(row!.squareAccessToken!);

  const { result } = await sq.catalogApi.listCatalog(undefined, 'ITEM');
  const items = result.objects ?? [];

  console.log(`\nTotal catalog items: ${items.length}`);
  items.forEach(obj => {
    console.log(`\n  ID: ${obj.id}`);
    console.log(`  Name: ${obj.itemData?.name}`);
    console.log(`  productType: ${obj.itemData?.productType}`);
    console.log(`  isDeleted: ${obj.isDeleted}`);
  });

  if (items.length === 0) console.log('  (no items found)');
}

run().catch(err => { console.error(err.message); process.exit(1); });
