import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
  ],
})
class SeedModule {}

// HYBRID SCENARIO TEST DATA
// Only 2 small listings (256KB each = 512KB total)
// When requesting 1MB for epochs 130-170, optimizer will use:
// - 512KB from marketplace (these 2 listings)
// - 512KB from system (new reservation)
const SAMPLE_LISTINGS = [
  {
    storageId: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
    seller: '0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
    size: 262144n, // 256KB
    startEpoch: 130,
    endEpoch: 170, // 40 epochs
    totalPrice: 4000000n, // 0.004 WAL - super cheap to beat system-only (402M FROST)
    lastTxDigest: 'ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZ567890ABCDEF',
    lastEventSeq: '1',
  },
  {
    storageId: '0x1b2c3d4e5f6a7890abcdef1234567890abcdef1234567890abcdef1234567890',
    seller: '0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
    size: 262144n, // 256KB
    startEpoch: 130,
    endEpoch: 170, // 40 epochs
    totalPrice: 6000000n, // 0.006 WAL - marketplace 10M + system 390M = 400M < 402M!
    lastTxDigest: 'ABC124DEF456GHI789JKL012MNO345PQR678STU901VWX234YZ567890ABCDEF',
    lastEventSeq: '2',
  },
];

// Additional test scenarios - uncomment to test different optimizer strategies
// FULL MARKETPLACE SCENARIO (10MB listing covers entire request)
/*
const SAMPLE_LISTINGS = [
  {
    storageId: '0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12345678901a',
    seller: '0xbcde2345678901abcdef2345678901abcdef2345678901abcdef2345678901bc',
    size: 10485760n, // 10MB
    startEpoch: 130,
    endEpoch: 170, // 40 epochs
    pricePerSizePerEpoch: 1000n,
    totalPrice: 419430400000n, // 1000 * 10MB * 40 epochs
    lastTxDigest: 'DEF456GHI789JKL012MNO345PQR678STU901VWX234YZ567890ABCDEF123ABC',
    lastEventSeq: '1',
  },
];
*/

// SYSTEM ONLY SCENARIO (no marketplace listings)
/*
const SAMPLE_LISTINGS = [];
*/

// COMPLEX SCENARIO (multiple listings of various sizes)
/*
const SAMPLE_LISTINGS = [
  {
    storageId: '0x3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef123456789012b',
    seller: '0xcdef3456789012abcdef3456789012abcdef3456789012abcdef3456789012cd',
    size: 104857600n, // 100MB
    startEpoch: 120,
    endEpoch: 220, // 100 epochs
    pricePerSizePerEpoch: 800n,
    totalPrice: 8388608000000n,
    lastTxDigest: 'GHI789JKL012MNO345PQR678STU901VWX234YZ567890ABCDEF123ABC456DEF',
    lastEventSeq: '1',
  },
  {
    storageId: '0x4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890123c',
    seller: '0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
    size: 52428800n, // 50MB
    startEpoch: 135,
    endEpoch: 165, // 30 epochs
    pricePerSizePerEpoch: 1200n,
    totalPrice: 1887436800000n,
    lastTxDigest: 'JKL012MNO345PQR678STU901VWX234YZ567890ABCDEF123ABC456DEF789GHI',
    lastEventSeq: '2',
  },
  {
    storageId: '0x890abcdef1234567890abcdef1234567890abcdef12345678901234567',
    seller: '0xcdef3456789012abcdef3456789012abcdef3456789012abcdef3456789012cd',
    size: 20971520n, // 20MB
    startEpoch: 130,
    endEpoch: 180, // 50 epochs
    pricePerSizePerEpoch: 900n,
    totalPrice: 943718400000n,
    lastTxDigest: 'VWX234YZ567890ABCDEF123ABC456DEF789GHI012JKL345MNO678PQR901STU',
    lastEventSeq: '3',
  },
];
*/

async function seedListings() {
  console.log('🌱 Starting marketplace listings seed...\n');

  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['error', 'warn'],
  });

  const prisma = app.get(PrismaService);

  try {
    // Clear existing listings
    console.log('🗑️  Clearing existing listings...');
    await prisma.listedStorage.deleteMany({});
    console.log('✅ Existing listings cleared\n');

    // Create new listings
    console.log('📝 Creating sample listings...');
    const created = await prisma.listedStorage.createMany({
      data: SAMPLE_LISTINGS,
    });

    console.log(`✅ Created ${created.count} marketplace listings\n`);

    // Display summary
    console.log('📊 Seed Summary:');
    console.log('━'.repeat(60));
    SAMPLE_LISTINGS.forEach((listing, index) => {
      const sizeInMB = Number(listing.size) / (1024 * 1024);
      const epochs = listing.endEpoch - listing.startEpoch;
      const priceInWAL = Number(listing.totalPrice) / 1e9;

      console.log(
        `${index + 1}. ${sizeInMB.toFixed(0)}MB | ${epochs} epochs | ${priceInWAL.toFixed(2)} WAL | ${listing.storageId.slice(0, 10)}...`,
      );
    });
    console.log('━'.repeat(60));

    console.log('\n✨ Seeding completed successfully!');
    console.log(
      '\n💡 You can now test the optimizer endpoint with these listings.',
    );
    console.log('\n📝 Test Scenario (HYBRID):');
    console.log('   POST /storage-optimizer/optimize');
    console.log('   { "size": "1048576", "startEpoch": 130, "endEpoch": 170 }');
    console.log('   → Will use 512KB from marketplace + 512KB from system');
    console.log('\n💡 Other scenarios available in seed script (see comments)');
    console.log('   - FULL MARKETPLACE: 10MB listing covers entire request');
    console.log('   - SYSTEM ONLY: No marketplace listings');
    console.log('   - COMPLEX: Multiple listings of various sizes\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

seedListings();
