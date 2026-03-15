const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Author = require('../models/Author');
const Category = require('../models/Category');

dotenv.config({ path: path.join(__dirname, '../.env') });

const authors = [
    {
        id: 'nam-cao',
        name: 'Nam Cao',
        birthYear: 1917,
        deathYear: 1951,
        bio: 'Nhà văn hiện thực xuất sắc với những tác phẩm về người nông dân và trí thức nghèo.',
        era: '1930-1945',
        avatar: '👨‍💼',
        region: 'Hà Nam'
    },
    {
        id: 'nguyen-du',
        name: 'Nguyễn Du',
        birthYear: 1765,
        deathYear: 1820,
        bio: 'Đại thi hào dân tộc, tác giả của Truyện Kiều.',
        era: 'Hậu Lê - Tây Sơn',
        avatar: '🖋️',
        region: 'Hà Tĩnh'
    },
    {
        id: 'xuan-dieu',
        name: 'Xuân Diệu',
        birthYear: 1916,
        deathYear: 1985,
        bio: 'Ông hoàng thơ tình Việt Nam.',
        era: 'Thơ Mới',
        avatar: '🌸',
        region: 'Bình Định'
    },
    {
        id: 'ngo-tat-to',
        name: 'Ngô Tất Tố',
        birthYear: 1893,
        deathYear: 1954,
        bio: 'Nhà văn tiêu biểu của dòng văn học hiện thực phê phán.',
        era: '1930-1945',
        avatar: '👨‍🏫',
        region: 'Bắc Ninh'
    }
];

const categories = [
    {
        id: 'prose',
        name: 'Văn xuôi',
        description: 'Các tác phẩm tự sự, truyện ngắn, tiểu thuyết.',
        icon: '📝',
        gradient: 'from-amber-600 to-orange-800'
    },
    {
        id: 'poetry',
        name: 'Thơ ca',
        description: 'Những áng thơ trữ tình, ca dao dân ca.',
        icon: '🖋️',
        gradient: 'from-purple-500 to-indigo-800'
    },
    {
        id: 'folk',
        name: 'Dân gian',
        description: 'Ca dao, tục ngữ, truyện cổ tích truyền miệng.',
        icon: '🎋',
        gradient: 'from-emerald-500 to-teal-700'
    },
    {
        id: 'history',
        name: 'Lịch sử',
        description: 'Tư liệu lịch sử và các tác phẩm dã sử.',
        icon: '📜',
        gradient: 'from-emerald-600 to-teal-900'
    },
    {
        id: 'classic',
        name: 'Kinh điển',
        description: 'Những tác phẩm bất hủ của văn học Việt Nam.',
        icon: '🏛️',
        gradient: 'from-blue-500 to-cyan-800'
    },
    {
        id: 'novel',
        name: 'Tiểu thuyết',
        description: 'Các tác phẩm văn xuôi có dung lượng lớn.',
        icon: '📔',
        gradient: 'from-red-500 to-rose-700'
    },
    {
        id: 'essay',
        name: 'Tùy bút',
        description: 'Ghi chép cảm xúc, suy nghĩ về cuộc sống.',
        icon: '📄',
        gradient: 'from-pink-500 to-fuchsia-800'
    }
];

const Book = require('../models/Book');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        // Update existing books to match new category IDs
        console.log('Migrating book categories...');
        await Book.updateMany({ category: 'tho' }, { category: 'poetry', categoryName: 'Thơ ca' });
        await Book.updateMany({ category: 'ca-dao' }, { category: 'folk', categoryName: 'Dân gian' });
        await Book.updateMany({ category: 'truyen-tho' }, { category: 'classic', categoryName: 'Kinh điển' });
        await Book.updateMany({ category: 'van-xuoi' }, { category: 'prose', categoryName: 'Văn xuôi' });

        // Clear existing data
        await Author.deleteMany({});
        await Category.deleteMany({});

        // Insert new data
        await Author.insertMany(authors);
        await Category.insertMany(categories);

        console.log('Successfully seeded Authors and Categories.');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
