export const categories = [
    { id: 'all', name: 'Tất cả', icon: '📚' },
    { id: 'prose', name: 'Văn xuôi', icon: '📝' },
    { id: 'poetry', name: 'Thơ ca', icon: '🖋️' },
    { id: 'literature', name: 'Văn học', icon: '📖' },
    { id: 'history', name: 'Lịch sử', icon: '📜' },
    { id: 'classic', name: 'Kinh điển', icon: '🏛️' },
    { id: 'science', name: 'Khoa học', icon: '🔬' },
    { id: 'philosophy', name: 'Triết học', icon: '🧠' },
    { id: 'novel', name: 'Tiểu thuyết', icon: '📔' },
    { id: 'essay', name: 'Luận văn', icon: '📄' },
    { id: 'biography', name: 'Tiểu sử', icon: '👤' },
    { id: 'folk', name: 'Dân gian', icon: '🎋' }
];

export const getCategoryName = (id: string) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : (id === 'all' ? 'Tất cả' : id);
};
