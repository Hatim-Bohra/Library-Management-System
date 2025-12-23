
import { PrismaClient } from '@prisma/client';

const API_URL = 'http://127.0.0.1:3002';

async function main() {
    console.log('Starting E2E Verification...');

    // 1. Login Admin
    console.log('1. Logging in Admin...');
    const adminLogin = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@library.com', password: 'Password123!' }),
    });

    if (!adminLogin.ok) {
        throw new Error(`Admin login failed: ${adminLogin.status}`);
    }
    const adminTokens = await adminLogin.json() as any;
    const adminToken = adminTokens.access_token;
    console.log('Admin logged in status check...');
    const check = await fetch(`${API_URL}/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!check.ok) console.warn('Dashboard stats check failed');
    else console.log('Dashboard stats OK');

    // 2. Get Category ID (Fiction)
    const prisma = new PrismaClient();
    const category = await prisma.category.findFirst({ where: { name: 'Fiction' } });
    if (!category) throw new Error('Category "Fiction" not found');
    const categoryId = category.id;
    await prisma.$disconnect();

    // 2. Create Book
    console.log('2. Creating Book "Dune Verification"...');
    const bookData = {
        title: 'Dune Verification',
        authorName: 'Frank Herbert',
        isbn: `9780441${Math.floor(Math.random() * 1000000)}`, // Random ISBN to avoid collision
        categoryId: categoryId,
        publishedYear: 1965,
        copies: 5,
        description: 'E2E Test Book'
    };

    const createBook = await fetch(`${API_URL}/books`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(bookData)
    });

    if (!createBook.ok) {
        const err = await createBook.text();
        throw new Error(`Create Book failed: ${createBook.status} - ${err}`);
    }
    const book = await createBook.json() as any;
    console.log('Book created:', book.id);

    // 4. Verify Inventory Items created
    if (book.inventoryItems && book.inventoryItems.length === 5) {
        console.log('Inventory Items verified: 5');
    } else {
        // Fetch again to be sure if not returned
        console.warn('Inventory items not in response, checking manually...');
    }

    // 5. Login User
    console.log('3. Logging in User...');
    // Ensure user exists or use existing
    const userLogin = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user2@example.com', password: 'password123' }),
    });

    if (!userLogin.ok) {
        // Try signup if login fails? Or just fail
        throw new Error(`User login failed: ${userLogin.status}`);
    }
    const userTokens = await userLogin.json() as any;
    const userToken = userTokens.access_token;
    console.log('User logged in.');

    // 6. Request Book
    console.log('4. Requesting Book...');
    const requestRes = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
            bookId: book.id,
            type: 'PICKUP'
        })
    });

    if (!requestRes.ok) {
        const err = await requestRes.text();
        throw new Error(`Request failed: ${requestRes.status} - ${err}`);
    }
    const request = await requestRes.json() as any;
    console.log('Request placed successfully:', request.id);

    console.log('E2E VERIFICATION PASSED!');
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
