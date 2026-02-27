import https from 'https';
import fs from 'fs';
import * as cheerio from 'cheerio';

const URLS = [
    'https://it.recaro-automotive.com/sedili-sportivi',
    'https://it.recaro-automotive.com/oem-prodotti',
    'https://it.recaro-automotive.com/sedili-racing'
];

async function fetchPage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function scrape() {
    const seats: any[] = [];

    for (const url of URLS) {
        const html = await fetchPage(url);
        const $ = cheerio.load(html);

        // Various selectors since RECARO site structure varies
        $('.tx-wc-recaro-site-product').each((i, el) => {
            const name = $(el).find('h3, h4, .title').text().trim();
            let img = $(el).find('img').attr('src');
            if (name && img) {
                if (!img.startsWith('http')) img = 'https://it.recaro-automotive.com' + img;
                seats.push({ name, img, category: url.includes('racing') ? 'Racing' : url.includes('sportivi') ? 'Sport' : 'OEM' });
            }
        });

        // Strategy 2: just links with images
        $('a').each((i, el) => {
            const img = $(el).find('img').attr('src');
            const text = $(el).text().trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
            if (img && text && text.toLowerCase().includes('recaro') && img.includes('product')) {
                let fullImg = img.startsWith('http') ? img : 'https://it.recaro-automotive.com' + img;
                seats.push({ name: text, img: fullImg, category: 'General' });
            }
        });
    }

    console.log(JSON.stringify(seats, null, 2));
}

scrape();
