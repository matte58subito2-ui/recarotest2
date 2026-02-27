async function testSync() {
    const API_KEY = 'recaro_sync_secure_2024';
    const URL = 'http://localhost:3000/api/sync/products';

    const testData = {
        source: 'MAGO_TEST',
        products: [
            {
                model_name: 'TEST_SYNC_PRODUCT',
                category: 'Comfort',
                description: 'Automated test product from MAGO ERP — should be deleted after testing.',
                base_price: 3499.00,
                image_url: '/seats/ergomed-es.png',
                active: false
            }
        ]
    };

    console.log('--- STARTING ERP SYNC TEST ---');
    try {
        const res = await fetch(URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify(testData)
        });

        const data = await res.json();
        console.log('Response Status:', res.status);
        console.log('Response Data:', JSON.stringify(data, null, 2));

        if (res.ok) {
            console.log('SUCCESS! Product synced correctly.');
        } else {
            console.log('FAILED! Check server logs.');
        }
    } catch (err) {
        console.error('ERROR during sync test:', err);
    }
}

testSync();
