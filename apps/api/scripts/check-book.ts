
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const book = await prisma.book.findFirst({
        where: {
            title: 'Dune Messiah',
        },
        include: {
            inventoryItems: true
        }
    });

    if (book) {
        console.log('Book found:', book);
        console.log('Inventory Items:', book.inventoryItems.length);
    } else {
        console.log('Book not found');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
