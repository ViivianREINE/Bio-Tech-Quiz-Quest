import { seedOmicsUnit1, seedPrismaClient } from './seeds/run-omics-seed.js';

async function main() {
  await seedOmicsUnit1();
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await seedPrismaClient.$disconnect();
  });
