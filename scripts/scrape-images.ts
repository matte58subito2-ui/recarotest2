import https from 'https';
import fs from 'fs';
import * as cheerio from 'cheerio';
import path from 'path';

const urls = [
    'https://it.recaro-automotive.com/classic/recaro-classic-pole-position-abe',
    'https://it.recaro-automotive.com/classic/recaro-classic-lx',
    'https://it.recaro-automotive.com/classic/recaro-classic-ls',
    'https://it.recaro-automotive.com/comfort/recaro-orthoped',
    'https://it.recaro-automotive.com/comfort/recaro-expert',
    'https://it.recaro-automotive.com/motorsport/recaro-pole-position-ng-fia',
    'https://it.recaro-automotive.com/motorsport/recaro-profi',
    'https://it.recaro-automotive.com/motorsport/recaro-pro-racer',
    'https://it.recaro-automotive.com/motorsport/recaro-p-1300-gt',
    'https://it.recaro-automotive.com/motorsport/recaro-podium-cf',
    'https://it.recaro-automotive.com/dinamica/recaro-cross-sportster-cs',
    'https://it.recaro-automotive.com/dinamica/recaro-sportster-cs'
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
        });
    });
}

async function scrape() {
    const finalSeats: any[] = [];

    for (const url of urls) {
        try {
            const html = await new Promise<string>((resolve) => {
                https.get(url, res => {
                    let d = '';
                    res.on('data', c => d += c);
                    res.on('end', () => resolve(d));
                });
            });

            const $ = cheerio.load(html);

            // Attempt to find the main product image
            let img = '';
            $('img').each((i, el) => {
                const src = $(el).attr('src') || '';
                if (src.includes('/images/prod') && !src.includes('thumbnails')) {
                    img = src;
                }
            });

            // Try fallback if no images/prod found
            if (!img) {
                $('img').each((i, el) => {
                    const src = $(el).attr('src') || '';
                    if (src.includes('csm_recaro') && (src.includes('hero') || src.includes('product'))) {
                        img = src;
                    }
                });
            }

            let nameRaw = url.split('/').pop() || '';
            let name = nameRaw.replace(/recaro-/g, '').replace(/-/g, ' ').toUpperCase().trim();

            if (img) {
                if (!img.startsWith('http')) img = 'https://it.recaro-automotive.com' + img;
                const urlObj = new URL(img);
                const ext = path.extname(urlObj.pathname);
                const filename = name.toLowerCase().replace(/\s+/g, '-') + ext;
                const filePath = path.join(dest, filename);

                await download(img, filePath);

                const category = url.includes('motorsport') ? 'Racing' : url.includes('dinamica') ? 'Sport' : url.includes('classic') ? 'Touring' : 'City';
                const base_price = Math.floor(Math.random() * 2000) + 900;

                finalSeats.push({
                    model_name: 'RECARO ' + name,
                    slug: filename.replace(ext, ''),
                    description: `Sedile originale RECARO serie ${category}. Elevati standard di sicurezza e comfort.`,
                    category: category,
                    image_url: '/seats/' + filename,
                    base_price: base_price
                });
                console.log(`✅ Downloaded: ${name} -> ${filename}`);
            } else {
                console.log(`❌ No image found for: ${name} (${url})`);
            }
        } catch (e: any) {
            console.log(`❌ Failed for ${url}: ${e.message}`);
        }
    }

    fs.writeFileSync('/Users/matteocomba/.gemini/antigravity/scratch/recaro/src/lib/scraped_seats.json', JSON.stringify(finalSeats, null, 2));
    console.log('Saved data to scraped_seats.json');
}

scrape();
