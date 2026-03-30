const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const User = require('../backend/models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://huuphong:nhom1thuvien@cluster0.indiagt.mongodb.net/Library';

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const users = [
            {
                username: 'admin',
                password: 'admin123',
                fullName: 'Quản trị viên Hệ thống',
                email: 'admin@thuvien.vn',
                role: 'admin',
                status: 'active'
            },
            {
                username: 'quanly',
                password: 'quanly123',
                fullName: 'Thủ thư Quản lý',
                email: 'quanly@thuvien.vn',
                role: 'librarian',
                status: 'active'
            }
        ];

        for (const u of users) {
            const existing = await User.findOne({ username: u.username });
            if (existing) {
                console.log(`Updating user: ${u.username}`);
                existing.password = u.password; // pre-save hook will hash it
                existing.role = u.role;
                existing.fullName = u.fullName;
                await existing.save();
            } else {
                console.log(`Creating user: ${u.username}`);
                await User.create(u);
            }
        }

        console.log('Seed completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
}

seed();
