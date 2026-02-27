import https from 'https';
import fs from 'fs';
import path from 'path';

const productData = [
    {
        "category": "Motorsport",
        "products": [
            {
                "name": "RECARO Podium CF",
                "image_url": "https://it.recaro-automotive.com/fileadmin/01-products/race/podium/recaro-podium-race-product.png?v=1747315089",
                "description": "Pioneer design for uncompromising performance on track and road."
            },
            {
                "name": "RECARO Podium GF",
                "image_url": "https://it.recaro-automotive.com/fileadmin/01-products/race/podium-gf/recaro-podium-gf-race-product-in-development.png?v=1747315090",
                "description": "On track and road, offering a perfect balance of comfort and support."
            },
            {
                "name": "RECARO Profi SPG",
                "image_url": "https://it.recaro-automotive.com/fileadmin/01-products/race/profi/recaro-profi-spg-product.png?v=1747315090",
                "description": "Premium hold in all positions, a favorite among professional racers."
            },
            {
                "name": "RECARO Pro Racer SPG & SPA",
                "image_url": "https://it.recaro-automotive.com/fileadmin/01-products/race/pro-racer/recaro-pro-racer-product.png?v=1747315090",
                "description": "Developed for professionals who want to win, with maximum safety."
            },
            {
                "name": "RECARO Pole Position N.G. (FIA)",
                "image_url": "https://it.recaro-automotive.com/fileadmin/01-products/race/pole-position-fia/recaro-pole-position-fia-product.png?v=1747315090",
                "description": "For immediate victories, providing excellent lateral support."
            }
        ]
    },
    {
        "category": "Stadium",
        "products": [
            {
                "name": "RECARO Stadium Seat (Player)",
                "image_url": "https://it.recaro-automotive.com/fileadmin/_processed_/2/9/csm_recaro-stadium-seats-player-1200x540_acb8fff86b.jpg",
                "description": "Professional dugout seating for champions and players."
            },
            {
                "name": "RECARO Stadium Seat (Nagai)",
                "image_url": "https://it.recaro-automotive.com/fileadmin/01-products/lifestyle/stadium-seats/recaro-stadium-seats-nagai-960x640.jpg?v=1747315084",
                "description": "High-performance stadium seating solution for international arenas."
            },
            {
                "name": "RECARO Stadium Seat (Leipzig)",
                "image_url": "https://it.recaro-automotive.com/fileadmin/01-products/lifestyle/stadium-seats/recaro-stadium-seats-leipzig-960x640.jpg?v=1747315084",
                "description": "Ergonomic benches designed for maximum comfort during the game."
            },
            {
                "name": "RECARO Stadium Seat (Public)",
                "image_url": "https://it.recaro-automotive.com/fileadmin/01-products/lifestyle/stadium-seats/recaro-stadium-seats-public-960x640.jpg?v=1747315084",
                "description": "Durable and comfortable seating for every spectator in the stands."
            },
            {
                "name": "RECARO Stadium Seat (VIP)",
                "image_url": "https://it.recaro-automotive.com/fileadmin/01-products/lifestyle/stadium-seats/recaro-stadium-seats-audi-960x640.jpg?v=1747315084",
                "description": "Customized premium seating with luxury branding and materials."
            }
        ]
    },
    {
        "category": "Comfort",
        "products": [
            {
                "name": "RECARO Ergomed E",
                "image_url": "https://it.recaro-automotive.com/fileadmin/01-products/comfort/ergomed/recaro-ergomed-e-product.png?v=1747315075",
                "description": "Arrive fresh with perfect ergonomics and classic design."
            },
            {
                "name": "RECARO Expert",
                "image_url": "https://it.recaro-automotive.com/fileadmin/01-products/comfort/expert/recaro-expert-product.png?v=1747315075",
                "description": "The expert in car seating, highly adaptable for personal needs."
            },
            {
                "name": "RECARO Specialist",
                "image_url": "https://it.recaro-automotive.com/fileadmin/01-products/comfort/specialist/recaro-specialist-product_01.png?v=1747315076",
                "description": "Specialist in adaptation needs with a slim, modular design."
            },
            {
                "name": "RECARO Ergomed ES",
                "image_url": "https://it.recaro-automotive.com/fileadmin/01-products/comfort/ergomed/recaro-ergomed-es-product.png?v=1747315075",
                "description": "Sophisticated ergonomic seat with high-end climate control features."
            },
            {
                "name": "RECARO Style Topline",
                "image_url": "https://it.recaro-automotive.com/fileadmin/01-products/comfort/style/recaro-style-product.png?v=1747315077",
                "description": "Combines elegance and supreme comfort with individual adjustment."
            }
        ]
    },
    {
        "category": "Nautic",
        "products": [
            {
                "name": "RECARO Maritime Bridge Seat",
                "image_url": "https://it.recaro-automotive.com/fileadmin/01-products/lifestyle/maritime-seats/recaro-maritime-seats-hero-1660x600.jpg?v=1747315083",
                "description": "Sit relaxed and enjoy the result on the high seas."
            },
            {
                "name": "RECARO Maritime Atlantic",
                "image_url": "https://it.recaro-automotive.com/fileadmin/01-products/lifestyle/maritime-seats/recaro-maritime-seats-bridge-01-960x640.jpg?v=1747315083",
                "description": "Premium luxury seating for yacht bridges and vessel control."
            },
            {
                "name": "RECARO Maritime Caspian",
                "image_url": "https://it.recaro-automotive.com/fileadmin/01-products/lifestyle/maritime-seats/recaro-maritime-seats-boat-960x640.jpg?v=1747315083",
                "description": "Durable maritime seating for professional boat operations."
            },
            {
                "name": "RECARO Maritime North Coast",
                "image_url": "https://it.recaro-automotive.com/fileadmin/01-products/lifestyle/maritime-seats/recaro-maritime-seats-bridge-02-960x640.jpg?v=1747315083",
                "description": "Ergonomic maritime solution for offshore and coastal navigation."
            },
            {
                "name": "RECARO Maritime Offshore",
                "image_url": "https://it.recaro-automotive.com/fileadmin/_processed_/c/9/csm_recaro-quicklink-footer-comfort-02-1200x720_a118e3c1c8.jpg",
                "description": "Ultimate comfort and stability in the most challenging sea conditions."
            }
        ]
    }
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

async function run() {
    const finalSeats: any[] = [];

    for (const group of productData) {
        for (const p of group.products) {
            const urlObj = new URL(p.image_url);
            let ext = path.extname(urlObj.pathname) || '.jpg';
            if (ext.includes('?')) ext = ext.split('?')[0];

            const safeName = p.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
            const filename = `${safeName}${ext}`;
            const filePath = path.join(dest, filename);

            console.log(`Downloading ${p.name}...`);
            const success = await download(p.image_url, filePath);
            if (success) {
                finalSeats.push({
                    model_name: p.name,
                    slug: safeName,
                    description: p.description,
                    category: group.category,
                    image_url: '/seats/' + filename,
                    base_price: Math.floor(Math.random() * 2000) + 1200
                });
                console.log(`✅ Saved: ${filename}`);
            } else {
                console.log(`❌ Failed: ${p.image_url}`);
            }
        }
    }

    fs.writeFileSync('/Users/matteocomba/.gemini/antigravity/scratch/recaro/src/lib/new_categories.json', JSON.stringify(finalSeats, null, 2));
    console.log(`Saved ${finalSeats.length} products to new_categories.json`);
}

run().catch(console.error);
