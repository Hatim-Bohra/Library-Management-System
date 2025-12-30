import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const CATEGORIES = [
    'Fiction',
    'Non-Fiction',
    'Science',
    'Technology',
    'History',
    'Biography',
    'Mystery',
    'Romance',
    'Horror',
    'Fantasy',
    'Sci-Fi',
    'Self-Help',
    'Health',
    'Travel',
    'Cooking',
    'Business',
    'Economics',
    'Politics',
    'Philosophy',
    'Religion',
    'Art',
    'Music',
    'Sports',
];

async function main() {
    console.log('🌱 Start seeding...');

    // Create admin user
    const adminEmail = 'admin@library.com';
    const adminExists = await prisma.user.findUnique({
        where: { email: adminEmail },
    });

    if (!adminExists) {
        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                name: 'Admin User',
                role: 'ADMIN',
            },
        });
        console.log('✅ Created admin user (email: admin@library.com, password: Admin@123)');
    } else {
        console.log('ℹ️  Admin user already exists');
    }

    // Seed categories
    for (const name of CATEGORIES) {
        const exists = await prisma.category.findUnique({
            where: { name },
        });

        if (!exists) {
            await prisma.category.create({
                data: {
                    name,
                    description: `Books related to ${name}`,
                },
            });
            console.log(`✅ Created category: ${name}`);
        } else {
            console.log(`ℹ️  Category already exists: ${name}`);
        }
    }

    console.log('🎉 Seeding finished successfully!');
    console.log('');
    console.log('📝 Default Admin Credentials:');
    console.log('   Email: admin@library.com');
    console.log('   Password: Admin@123');
    console.log('');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
