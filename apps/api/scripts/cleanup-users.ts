import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting User Cleanup...');

    // Define correct users
    const validUsers = [
        { email: 'admin@library.com', role: Role.ADMIN, firstName: 'Admin', lastName: 'User', password: 'Password123!' },
        { email: 'librarian@library.com', role: Role.LIBRARIAN, firstName: 'Librarian', lastName: 'User', password: 'Password123!' },
        { email: 'user@library.com', role: Role.MEMBER, firstName: 'Test', lastName: 'User', password: 'Password123!' },
    ];

    // 1. Delete all other users
    const validEmails = validUsers.map(u => u.email);
    console.log(`Keeping users: ${validEmails.join(', ')}`);

    // Check dependent records (Loans/Requests) before deleting?
    // Delete cascading likely handled by DB or explicit Prisma delete needed.
    // Let's assume on delete cascade or just delete them manually.

    // Find IDs to delete
    const usersToDelete = await prisma.user.findMany({
        where: {
            email: { notIn: validEmails }
        },
        select: { id: true, email: true }
    });

    console.log(`Found ${usersToDelete.length} users to delete.`);

    for (const u of usersToDelete) {
        console.log(`Deleting ${u.email}...`);
        try {
            // Delete dependent data if needed, or rely on cascade
            // Assuming relations exist: BookRequest, Loan, Fine, AuditLog
            await prisma.fine.deleteMany({ where: { loan: { userId: u.id } } }); // Fines linked to Loan, which is linked to User
            await prisma.loan.deleteMany({ where: { userId: u.id } });
            await prisma.bookRequest.deleteMany({ where: { userId: u.id } });
            await prisma.auditLog.deleteMany({ where: { performedBy: u.id } });
            await prisma.user.delete({ where: { id: u.id } });
        } catch (e) {
            console.error(`Failed to delete user ${u.email}:`, e);
        }
    }

    // 2. Ensure valid users exist and have correct roles/passwords
    for (const u of validUsers) {
        const hash = await bcrypt.hash(u.password, 10);
        await prisma.user.upsert({
            where: { email: u.email },
            update: {
                role: u.role,
                firstName: u.firstName,
                lastName: u.lastName,
                password: hash // Reset password to known value
            },
            create: {
                email: u.email,
                role: u.role,
                firstName: u.firstName,
                lastName: u.lastName,
                password: hash
            }
        });
        console.log(`Upserted ${u.email}`);
    }

    console.log('Cleanup finished.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
