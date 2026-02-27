import https from 'https';
import fs from 'fs';
import * as cheerio from 'cheerio';
import path from 'path';

const categories = [
    { name: 'Motorsport', urls: ['https://it.recaro-automotive.com/motorsport'] },
    { name: 'Stadium', urls: ['https://it.recaro-automotive.com/stadio'] },
    { name: 'Comfort', urls: ['https://it.recaro-automotive.com/comfort'] },
    { name: 'Nautic', urls: ['https://it.recaro-automotive.com/nautica'] }
];

const dest = '/Users/matteocomba/.gemini/antigravity/scratch/recaro/public/seats';
if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

async function download(url: string, filePath: string) {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                const file = fs.createWriteStream(filePath);
                res.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(true);
                });
            } else {
                resolve(false);
            }
        }).on('error', () => resolve(false));
    });
}

async function getHtml(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                const newUrl = res.headers.location;
                if (newUrl) return resolve(getHtml(newUrl.startsWith('http') ? newUrl : 'https://it.recaro-automotive.com' + newUrl));
            }
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => resolve(d));
        }).on('error', reject);
    });
}

async function scrape() {
    const finalSeats: any[] = [];

    for (const cat of categories) {
        for (const catUrl of cat.urls) {
            console.log(`Scraping category: ${cat.name} from ${catUrl}`);
            const html = await getHtml(catUrl);
            const $ = cheerio.load(html);

            const products = $('.item.all');
            console.log(`Found ${products.length} product blocks in ${cat.name}`);

            for (let i = 0; i < products.length; i++) {
                const el = products[i];
                const imgTag = $(el).find('img');
                const nameTag = $(el).find('div:not([class])').first();
                const linkTag = $(el).find('a.button').first();

                let name = nameTag.text().trim() || $(el).text().trim().split('\n')[0].trim();
                let imgSrc = imgTag.attr('src');

                if (!name || name.length < 3 || name.toUpperCase() === 'DI PIÙ' || name.toUpperCase() === 'SCOPRI DI PIÙ') {
                    // Try to get name from link alt or previous siblings
                    name = imgTag.attr('alt') || imgTag.attr('title') || "";
                }

                // Cleanup name
                name = name.replace(/RECARO/gi, '').trim().toUpperCase();
                if (!name) continue;

                if (imgSrc && !imgSrc.startsWith('http')) imgSrc = 'https://it.recaro-automotive.com' + imgSrc;

                if (imgSrc && name) {
                    const urlObj = new URL(imgSrc);
                    const ext = path.extname(urlObj.pathname) || '.png';
                    const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    const filename = `${safeName}${ext}`;
                    const filePath = path.join(dest, filename);

                    const success = await download(imgSrc, filePath);
                    if (success) {
                        finalSeats.push({
                            model_name: 'RECARO ' + name,
                            slug: safeName,
                            description: `Professional RECARO seat for ${cat.name}. High standards for safety, ergonomics and comfort.`,
                            category: cat.name,
                            image_url: '/seats/' + filename,
                            base_price: Math.floor(Math.random() * 2000) + 1200
                        });
                        console.log(`✅ ${cat.name}: ${name} -> ${filename}`);
                    }
                }
            }
        }
    }

    // Dedup by slug
    const uniqueSeats = Array.from(new Map(finalSeats.map(item => [item.slug + item.category, item])).values());

    fs.writeFileSync('/Users/matteocomba/.gemini/antigravity/scratch/recaro/src/lib/new_categories.json', JSON.stringify(uniqueSeats, null, 2));
    console.log(`Saved ${uniqueSeats.length} unique products to new_categories.json`);
}

scrape().catch(console.error);
