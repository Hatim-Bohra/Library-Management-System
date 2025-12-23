import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@library.com';
    const password = 'Password123!';
    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: { role: Role.ADMIN },
        create: {
            email,
            password: hash,
            firstName: 'Admin',
            lastName: 'User',
            role: Role.ADMIN,
        },
    });

    console.log(`Admin user created: ${user.email} with role ${user.role}`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
