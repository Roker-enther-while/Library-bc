/**
 * response.formatter.js - Formatting AI output for the client
 */

const formatAIResponse = (rawText) => {
    if (!rawText) return "Xin lỗi, tôi không thể xử lý yêu cầu lúc này.";

    let formattedText = rawText;

    // Lọc bỏ [SUY NGHĨ NỘI BỘ] và [Ý KIẾN HỘI ĐỒNG]
    // Chỉ lấy nội dung sau [PHẢN HỒI THƯ ĐỒNG]
    const match = rawText.match(/\[PHẢN HỒI THƯ ĐỒNG\]\s*([\s\S]*)/i);
    if (match && match[1]) {
        formattedText = match[1];
    } else {
        // Fallback: Xóa thủ công nếu không đúng chuẩn markdown
        formattedText = formattedText.replace(/\[SUY NGHĨ NỘI BỘ\][\s\S]*?\[Ý KIẾN HỘI ĐỒNG\][\s\S]*?(?=\n\n|$)/i, '');
        formattedText = formattedText.replace(/\[SUY NGHĨ NỘI BỘ\][\s\S]*?\[PHẢN HỒI THƯ ĐỒNG\]/i, '');
        formattedText = formattedText.replace(/\[Ý KIẾN HỘI ĐỒNG\][\s\S]*?\[PHẢN HỒI THƯ ĐỒNG\]/i, '');
    }

    // Clean up
    formattedText = formattedText.replace(/\[PHẢN HỒI THƯ ĐỒNG\]/ig, '');
    formattedText = formattedText.replace(/\n{3,}/g, '\n\n');
    formattedText = formattedText.trim();

    return formattedText;
};

module.exports = { formatAIResponse };
