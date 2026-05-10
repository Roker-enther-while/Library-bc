const axios = require('axios');

async function checkStructure() {
    try {
        const { data } = await axios.get('http://localhost:5000/api/books');
        console.log('Books count:', data.length);
        if (data.length > 0) {
            console.log('Sample book structure:', JSON.stringify(data[0], null, 2));
            const featuredCount = data.filter(b => b.isFeatured).length;
            console.log('Featured books in API response:', featuredCount);
        }
    } catch (err) {
        console.error(err);
    }
}

checkStructure();
