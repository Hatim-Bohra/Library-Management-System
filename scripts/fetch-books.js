const fs = require('fs');
const path = require('path');
const https = require('https');

// --- Configuration ---
const TARGET_FILE = path.join(__dirname, '../data/lumina_library_dataset.csv');
const TARGET_COUNT = 5500; // Aim slightly higher to account for duplicates/missing data
const SUBJECTS = [
    'fantasy', 'science_fiction', 'romance', 'mystery_and_detective_stories',
    'horror', 'thriller', 'historical_fiction', 'biography',
    'history', 'art', 'cooking', 'travel', 'business',
    'psychology', 'philosophy', 'religion', 'science',
    'programming', 'architecture', 'music'
];

const CSV_HEADER = 'Title,Author,ISBN,Genre,Description,CoverUrl,RentalPrice,Copies\n';

// --- Price Randomizer ---
function generatePrice() {
    // Weighted logic: common prices like 1.99, 2.99, 3.99, 4.99 favor lower end
    const tiers = [1.99, 2.99, 2.99, 3.99, 3.99, 4.99, 4.99, 5.99, 7.99, 9.99];
    return tiers[Math.floor(Math.random() * tiers.length)];
}

function generateCopies() {
    // Weighted logic: 1-5 copies common, rarely 10+
    const r = Math.random();
    if (r > 0.95) return Math.floor(Math.random() * 10) + 10; // 10-20
    if (r > 0.7) return Math.floor(Math.random() * 5) + 3; // 3-8
    return Math.floor(Math.random() * 3) + 1; // 1-3
}

// --- Fetch Logic ---
async function fetchSubject(subject) {
    return new Promise((resolve, reject) => {
        const url = `https://openlibrary.org/subjects/${subject}.json?limit=400&details=true`; // Max limit usually around there
        console.log(`Fetching ${subject}...`);

        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json.works || []);
                } catch (e) {
                    console.error(`Error parsing ${subject}:`, e.message);
                    resolve([]);
                }
            });
        }).on('error', (err) => {
            console.error(`Network error for ${subject}:`, err.message);
            resolve([]);
        });
    });
}

// --- Main Execution ---
async function main() {
    console.log('Starting Dataset Generation...');

    let books = [];
    const seenISBNs = new Set();

    // Create data dir if not exists
    const dataDir = path.dirname(TARGET_FILE);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    // 1. Fetch Loop
    for (const subject of SUBJECTS) {
        if (books.length >= TARGET_COUNT) break;

        const works = await fetchSubject(subject);

        for (const work of works) {
            // Basic Validation
            if (!work.title || !work.authors || work.authors.length === 0) continue;

            // Attempt to find an ISBN (OpenLibrary subject API makes this tricky, sometimes availability has isbn)
            // We prioritize `availability.isbn` or defaulting to a dummy if strictly needed, 
            // BUT for a "Real" dataset we want real ISBNs. 
            // The subject API returns 'availability' object often containing ISBN.

            let isbn = null;
            if (work.availability && work.availability.isbn) {
                isbn = work.availability.isbn;
            }

            // If no ISBN, we skip this book to maintain high quality (Task requirement: Real data)
            if (!isbn) continue;

            // Clean ISBN (sometimes it's a list or space separated)
            // We'll take the first valid-looking 10 or 13 digit string
            /* Note: API might return "978123 123123" */
            const isbnMatch = isbn.match(/(\d{10}|\d{13})/);
            if (!isbnMatch) continue;
            const strictISBN = isbnMatch[0];

            if (seenISBNs.has(strictISBN)) continue;
            seenISBNs.add(strictISBN);

            // Field Mapping
            const title = work.title.replace(/"/g, '""'); // CSV escape
            const author = work.authors[0].name.replace(/"/g, '""');

            // Construct Cover URL
            // Open Library Covers: https://covers.openlibrary.org/b/id/{cover_id}-L.jpg
            let coverUrl = '';
            if (work.cover_id) {
                coverUrl = `https://covers.openlibrary.org/b/id/${work.cover_id}-L.jpg`;
            }

            // Description
            // Often strictly not in subject view, we might leave empty or use subject tags
            let description = `A book about ${subject.replace(/_/g, ' ')}.`;

            // Genre Mapping (Capitalized subject)
            const genre = subject.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

            books.push({
                Title: `"${title}"`,
                Author: `"${author}"`,
                ISBN: strictISBN,
                Genre: `"${genre}"`,
                Description: `"${description}"`,
                CoverUrl: coverUrl,
                RentalPrice: generatePrice(),
                Copies: generateCopies()
            });
        }

        console.log(`  > Got ${works.length} raw items from ${subject}. Total unique valid books: ${books.length}`);

        // Polite delay
        await new Promise(r => setTimeout(r, 500));
    }

    // 2. Write CSV
    console.log(`Writing ${books.length} records to ${TARGET_FILE}...`);
    const stream = fs.createWriteStream(TARGET_FILE);
    stream.write(CSV_HEADER);

    books.forEach(b => {
        stream.write(`${b.Title},${b.Author},${b.ISBN},${b.Genre},${b.Description},${b.CoverUrl},${b.RentalPrice},${b.Copies}\n`);
    });

    stream.end();
    console.log('Done!');
}

main();
