import { PrismaClient } from '@prisma/client';

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
    console.log('Start seeding...');

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
            console.log(`Created category: ${name}`);
        } else {
            console.log(`Category already exists: ${name}`);
        }
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
