const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        const users = [
            {
                username: 'admin',
                password: 'admin123',
                fullName: 'Quản trị viên',
                role: 'admin',
                email: 'admin@thuvien.com'
            },
            {
                username: 'librarian',
                password: 'lib123',
                fullName: 'Thủ thư chính',
                role: 'librarian',
                email: 'lib@thuvien.com'
            }
        ];

        for (const u of users) {
            const existing = await User.findOne({ username: u.username });
            if (!existing) {
                await User.create(u);
                console.log(`Created user: ${u.username}`);
            } else {
                console.log(`User already exists: ${u.username}`);
            }
        }

        console.log('User seeding completed.');
        process.exit();
    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
};

seedUsers();
