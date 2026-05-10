const axios = require('axios');

async function checkAll() {
    try {
        console.log('Fetching books...');
        const b = await axios.get('http://localhost:5000/api/books');
        console.log('Books:', b.data.length);

        console.log('Fetching authors...');
        const a = await axios.get('http://localhost:5000/api/authors');
        console.log('Authors:', a.data.length);

        console.log('Fetching categories...');
        const c = await axios.get('http://localhost:5000/api/categories');
        console.log('Categories:', c.data.length);

        process.exit(0);
    } catch (err) {
        console.error('Error fetching:', err.message);
        process.exit(1);
    }
}

checkAll();
