const NodeCache = require('node-cache');

// Tạo instance cache với giới hạn để an toàn cho server 1GB RAM
// stdTTL: 600s (10 phút), checkperiod: 120s (2 phút), maxKeys: 500 (tối đa 500 bản ghi)
const cache = new NodeCache({
    stdTTL: 600,
    checkperiod: 120,
    maxKeys: 500
});

/**
 * Middleware để kiểm tra xem request đã có trong cache chưa
 * Cấu trúc giống như cơ chế Redis get/set
 */
const cacheMiddleware = (req, res, next) => {
    // Chỉ cache các request GET
    if (req.method !== 'GET') {
        return next();
    }

    // Lấy URL làm key cho bộ đệm
    const key = req.originalUrl || req.url;

    // Lấy dữ liệu từ Cache (Redis-like behavior)
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
        console.log(`[Cache Hit] Trả về dữ liệu từ bộ nhớ đệm cho: ${key}`);
        return res.json(cachedResponse);
    } else {
        console.log(`[Cache Miss] Đang lấy dữ liệu từ Database cho: ${key}`);
        // Ghi đè hàm res.json để tự động lưu vào cache ngay trước khi trả về cho client
        res.originalJson = res.json;
        res.json = (body) => {
            res.originalJson(body);
            cache.set(key, body);
        };
        next();
    }
};

/**
 * Hàm tiện ích để xóa cache (ví dụ khi admin thêm sửa xóa sách)
 */
const clearCache = (keyPrefix) => {
    const keys = cache.keys();
    keys.forEach(key => {
        if (key.includes(keyPrefix)) {
            cache.del(key);
            console.log(`[Cache Cleared] Đã xóa cache cho: ${key}`);
        }
    });
};

module.exports = {
    cacheMiddleware,
    clearCache
};
