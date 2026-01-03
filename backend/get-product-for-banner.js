const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getProduct() {
    try {
        const product = await prisma.product.findFirst({
            where: { isActive: true },
            orderBy: { margin: 'desc' }
        });
        console.log(JSON.stringify(product));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

getProduct();
