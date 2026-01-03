const { PrismaClient } = require('@prisma/client');

const NEON_URL = "postgresql://neondb_owner:npg_5AzdsSYIxJ9C@ep-falling-shape-abbss0l8-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require";
const LOCAL_URL = "postgresql://postgres:postgres@localhost:5432/nutriplus?schema=public";

async function migrate() {
    console.log('🚀 Starting Data Migration: Local -> Neon');

    const local = new PrismaClient({ datasources: { db: { url: LOCAL_URL } } });
    const neon = new PrismaClient({ datasources: { db: { url: NEON_URL } } });

    try {
        // Order of deletion (Reverse dependencies)
        console.log('🧹 Clearing Neon DB...');
        await neon.banner.deleteMany({});
        await neon.location.deleteMany({});
        await neon.order.deleteMany({});
        await neon.product.deleteMany({});
        await neon.user.deleteMany({});
        console.log('✅ Neon DB Cleared.');

        // 1. Users
        console.log('👥 Migrating Users...');
        const users = await local.user.findMany();
        if (users.length > 0) {
            await neon.user.createMany({ data: users });
            console.log(`✅ ${users.length} Users migrated.`);
        }

        // 2. Products
        console.log('📦 Migrating Products...');
        const products = await local.product.findMany();
        if (products.length > 0) {
            await neon.product.createMany({ data: products });
            console.log(`✅ ${products.length} Products migrated.`);
        }

        // 3. Banners
        console.log('🖼️ Migrating Banners...');
        const banners = await local.banner.findMany();
        if (banners.length > 0) {
            await neon.banner.createMany({ data: banners });
            console.log(`✅ ${banners.length} Banners migrated.`);
        }

        // 4. Locations
        console.log('📍 Migrating Locations...');
        const locations = await local.location.findMany();
        if (locations.length > 0) {
            await neon.location.createMany({ data: locations });
            console.log(`✅ ${locations.length} Locations migrated.`);
        }

        // 5. Orders
        console.log('🛒 Migrating Orders...');
        const orders = await local.order.findMany();
        if (orders.length > 0) {
            await neon.order.createMany({ data: orders });
            console.log(`✅ ${orders.length} Orders migrated.`);
        }

        console.log('🎉 Migration Complete!');

    } catch (error) {
        console.error('❌ Migration Failed:', error);
    } finally {
        await local.$disconnect();
        await neon.$disconnect();
    }
}

migrate();
