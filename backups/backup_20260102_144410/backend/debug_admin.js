const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Debugging Admin Users...');
  
  try {
    const users = await prisma.user.findMany();
    console.log(`✅ Found ${users.length} users in database.`);
    
    const admins = users.filter(u => u.role === 'ADMIN');
    console.log(`👮 Found ${admins.length} ADMIN users.`);
    
    if (admins.length > 0) {
      console.log('Admins:', admins.map(u => ({ id: u.id, email: u.email, role: u.role })));
    } else {
      console.log('⚠️ No ADMIN users found! You might need to promote a user to ADMIN.');
      
      // Attempt to promote the first user to ADMIN for testing if needed
      if (users.length > 0) {
          const firstUser = users[0];
          console.log(`💡 Suggestion: Promote ${firstUser.email} to ADMIN?`);
          // Uncomment to verify functionality:
          // await prisma.user.update({ where: { id: firstUser.id }, data: { role: 'ADMIN' } });
      }
    }

  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
