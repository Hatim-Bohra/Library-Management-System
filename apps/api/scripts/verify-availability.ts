
const API_URL = 'http://127.0.0.1:3001';

async function main() {
    console.log('Starting Availability Verification...');

    // 1. Login Admin
    const adminLogin = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@library.com', password: 'Password123!' }),
    });
    if (!adminLogin.ok) throw new Error('Admin login failed');
    const { access_token } = await adminLogin.json() as any;

    // 1.5 Get Category
    const catRes = await fetch(`${API_URL}/categories`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
    });
    const categories = await catRes.json() as any;
    const categoryId = categories[0]?.id;
    if (!categoryId) throw new Error('No categories found');

    // 2. Create Book with 1 copy
    const bookData = {
        title: 'Availability Test Book',
        authorName: 'Tester',
        isbn: `TEST-${Date.now()}`,
        categoryId: categoryId,
        publishedYear: 2024,
        copies: 1, // Only 1 copy
        description: 'Test'
    };

    console.log('Creating book with 1 copy...');
    const createRes = await fetch(`${API_URL}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${access_token}` },
        body: JSON.stringify(bookData)
    });
    if (!createRes.ok) throw new Error('Create book failed');
    const book = await createRes.json() as any;
    console.log('Book created:', book.id, 'Available:', book.isAvailable);

    if (!book.isAvailable) throw new Error('Book should be available initially');

    // 3. Request (Issue) the copy
    // We need a user to request it.
    const userLogin = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user2@example.com', password: 'password123' }),
    });
    if (!userLogin.ok) throw new Error('User login failed');
    const { access_token: userToken, user: { id: userId } } = await userLogin.json() as any;

    console.log('Placing request to reserve copy...');
    const reqRes = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({ bookId: book.id, type: 'PICKUP' })
    });
    if (!reqRes.ok) throw new Error(`Request failed: ${await reqRes.text()}`);
    const request = await reqRes.json() as any;

    // Approve Request (Assuming this reserves the item)
    console.log('Approving request...');
    const approveRes = await fetch(`${API_URL}/requests/${request.id}/approve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${access_token}` }
    });
    if (!approveRes.ok) throw new Error('Approve failed');

    // TRIGGER Availability Check? 
    // It should happen automatically in backend service logic for `approve`?
    // Inspect RequestsService.approve logic... it calls `inventoryItem.update(RESERVED)`.
    // Does it call `booksService.checkAvailability`? If not, `isAvailable` won't update!

    // Let's check the book status again
    const checkRes = await fetch(`${API_URL}/books/${book.id}`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
    });
    const updatedBook = await checkRes.json() as any;
    console.log('Book status after reservation:', updatedBook.isAvailable);

    // If logic is missing in `approve`, this will show TRUE (which is WRONG if we want real-time availability).
    // Ideally, `RequestsService` should trigger availability check.

    if (updatedBook.isAvailable) {
        console.warn('WARNING: Book is still marked available after reservation! Logic missing in RequestsService?');
    } else {
        console.log('SUCCESS: Book is marked unavailable.');
    }
}

main().catch(console.error);
