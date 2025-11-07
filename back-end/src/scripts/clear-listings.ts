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
class ClearModule {}

async function clearListings() {
  console.log('🗑️  Starting marketplace listings cleanup...\n');

  const app = await NestFactory.createApplicationContext(ClearModule, {
    logger: ['error', 'warn'],
  });

  const prisma = app.get(PrismaService);

  try {
    // Count current listings
    const count = await prisma.listedStorage.count();
    console.log(`📊 Found ${count} listings in database`);

    if (count === 0) {
      console.log('✅ Database is already empty\n');
      await app.close();
      return;
    }

    // Clear all listings
    console.log('🗑️  Deleting all listings...');
    const result = await prisma.listedStorage.deleteMany({});

    console.log(`✅ Deleted ${result.count} marketplace listings\n`);
    console.log('✨ Cleanup completed successfully!\n');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

clearListings();
