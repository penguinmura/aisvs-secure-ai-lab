const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

async function check() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@example.com' }});
  console.log('User role from DB:', user.role);
  const token = jwt.sign({ userId: user.id, role: user.role }, 'secret');
  const decoded = jwt.decode(token);
  console.log('Decoded role:', decoded.role);
}
check();
