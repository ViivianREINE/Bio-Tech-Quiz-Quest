import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

const startServer = async () => {
  try {
    // Verify database connection before binding port
    await prisma.$connect();
    console.log('✅ PostgreSQL database connected successfully.');

    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Bio-Tech-Quiz-Quest backend running on port ${env.PORT} [${env.NODE_ENV}]`);
      console.log(`📡 Health endpoint: http://localhost:${env.PORT}/api/health`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('HTTP server closed.');
        await prisma.$disconnect();
        console.log('Database connection closed.');
        process.exit(0);
      });

      // Force shutdown after 10s if graceful fails
      setTimeout(() => {
        console.error('Forcing shutdown after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();
