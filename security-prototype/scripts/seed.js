const { connectDB } = require('../database/connection');
const User = require('../models/User');
const Book = require('../models/Book');
const SecurityLog = require('../models/SecurityLog');

async function seed() {
    try {
        await connectDB('Database-Seeder');
        
        console.log('🧹 Clearing existing collections...');
        await User.deleteMany({});
        await Book.deleteMany({});
        await SecurityLog.deleteMany({});
        console.log('✓ Database cleared.');

        console.log('🌱 Creating default user accounts...');
        
        // Admin
        const adminUser = new User({
            username: 'admin',
            password: 'adminpassword',
            fullName: 'Nguyen Van Admin',
            email: 'admin@library.com',
            phone: '0901234567',
            studentId: 'AD-9999',
            role: 'admin'
        });
        await adminUser.save();
        console.log('✓ Admin user created. (Sensitive fields encrypted in MongoDB)');

        // Librarian
        const librarianUser = new User({
            username: 'librarian',
            password: 'libpassword',
            fullName: 'Tran Thi Librarian',
            email: 'librarian@library.com',
            phone: '0908765432',
            studentId: 'LB-8888',
            role: 'librarian'
        });
        await librarianUser.save();
        console.log('✓ Librarian user created. (Sensitive fields encrypted in MongoDB)');

        // Reader
        const readerUser = new User({
            username: 'reader',
            password: 'readerpassword',
            fullName: 'Le Van Reader',
            email: 'reader@student.com',
            phone: '0987654321',
            studentId: 'RD-1234',
            role: 'reader'
        });
        await readerUser.save();
        console.log('✓ Reader user created. (Sensitive fields encrypted in MongoDB)');

        console.log('🌱 Creating default books...');
        const books = [
            {
                title: 'Lap Trinh Web Voi Node.js',
                author: 'Nguyen Van A',
                category: 'Cong Nghe Thong Tin',
                isbn: '978-604-0-12345-6'
            },
            {
                title: 'Kien Truc Phan Mem Hien Dai',
                author: 'Tran Huu B',
                category: 'Cong Nghe Thong Tin',
                isbn: '978-604-0-67890-1'
            }
        ];
        
        await Book.insertMany(books);
        console.log(`✓ Seeded ${books.length} default books.`);

        console.log('🚀 Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
}

seed();
