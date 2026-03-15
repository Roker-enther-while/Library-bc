const nodemailer = require('nodemailer');

const createTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const checkEmail = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  Email chưa được cấu hình (EMAIL_USER / EMAIL_PASS). Bỏ qua gửi mail.');
    return false;
  }
  return true;
};

// ─── Shared HTML Layout ────────────────────────────────────────────────────────
const wrapEmail = ({ headerBg = 'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)', badgeColor, badgeText, contentHtml, subject }) => `
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.12);">

      <!-- Header -->
      <tr>
        <td style="background:${headerBg};padding:36px 40px;text-align:center;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;margin-bottom:16px;">📚</div>
                <h1 style="margin:0 0 6px;color:#fff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Thư Viện Văn Học Việt Nam</h1>
                <div style="display:inline-block;background:${badgeColor};color:#fff;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:5px 16px;border-radius:20px;margin-top:8px;">${badgeText}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Content -->
      <tr><td style="padding:36px 40px;">${contentHtml}</td></tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f8fafc;border-top:1px solid #e8ecf0;padding:24px 40px;text-align:center;">
          <p style="margin:0 0 6px;color:#64748b;font-size:13px;font-weight:600;">📍 Thư Viện Văn Học Việt Nam</p>
          <p style="margin:0;color:#94a3b8;font-size:11px;">Email tự động — Vui lòng không trả lời trực tiếp email này</p>
          <div style="margin-top:16px;font-size:11px;color:#cbd5e1;">© ${new Date().getFullYear()} Thư Viện Văn Học Việt Nam. All rights reserved.</div>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

// ─── 1. Due Date Reminder Email (UPGRADED) ────────────────────────────────────
const sendDueReminderEmail = async ({ toEmail, borrowerName, bookTitle, dueDate, daysLeft }) => {
  if (!checkEmail()) return false;

  const dueDateFormatted = new Date(dueDate).toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const isOverdue = daysLeft < 0;
  const urgencyColor = isOverdue ? '#dc2626' : daysLeft <= 1 ? '#d97706' : '#2563eb';
  const urgencyBg = isOverdue ? '#fef2f2' : daysLeft <= 1 ? '#fffbeb' : '#eff6ff';
  const urgencyBorder = isOverdue ? '#fca5a5' : daysLeft <= 1 ? '#fcd34d' : '#93c5fd';
  const urgencyText = isOverdue
    ? `⚠️ Quá hạn ${Math.abs(daysLeft)} ngày`
    : daysLeft === 0 ? '⏰ Hết hạn HÔM NAY' : `📅 Còn ${daysLeft} ngày`;

  const headerBg = isOverdue
    ? 'linear-gradient(135deg,#7f1d1d 0%,#991b1b 100%)'
    : daysLeft <= 1
      ? 'linear-gradient(135deg,#78350f 0%,#92400e 100%)'
      : 'linear-gradient(135deg,#1e3a5f 0%,#1e40af 100%)';

  const contentHtml = `
      <p style="margin:0 0 8px;color:#1e293b;font-size:16px;font-weight:600;">Xin chào, <span style="color:#1e40af;">${borrowerName}</span> 👋</p>
      <p style="margin:0 0 28px;color:#64748b;font-size:14px;line-height:1.7;">
        Chúng tôi xin gửi thông báo về phiếu mượn sách của bạn tại Thư viện Văn học Việt Nam.
      </p>

      <!-- Book Card -->
      <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;margin-bottom:24px;">
        <div style="background:#1e293b;padding:12px 20px;">
          <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:700;">📖 Sách đang mượn</p>
        </div>
        <div style="padding:20px;">
          <p style="margin:0 0 16px;font-size:18px;font-weight:800;color:#0f172a;">${bookTitle}</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:12px;">
                <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Hạn trả sách</p>
                <p style="margin:0;font-size:14px;color:#334155;font-weight:600;">${dueDateFormatted}</p>
              </td>
              <td>
                <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Tình trạng</p>
                <p style="margin:0;font-size:14px;font-weight:800;color:${urgencyColor};">${urgencyText}</p>
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Urgency Banner -->
      <div style="background:${urgencyBg};border:1.5px solid ${urgencyBorder};border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        ${isOverdue
      ? `<p style="margin:0;color:#991b1b;font-size:14px;font-weight:600;">⚠️ Sách đã quá hạn <strong>${Math.abs(daysLeft)} ngày</strong>. Vui lòng đến thư viện để trả sách <strong>ngay hôm nay</strong> để tránh phát sinh phí phạt.</p>`
      : daysLeft === 0
        ? `<p style="margin:0;color:#92400e;font-size:14px;font-weight:600;">⏰ Hôm nay là ngày cuối cùng để trả sách. Hãy đến thư viện trả sách trước khi đóng cửa nhé!</p>`
        : `<p style="margin:0;color:#1e40af;font-size:14px;font-weight:600;">📅 Bạn còn <strong>${daysLeft} ngày</strong> để trả sách. Xin đừng để quá hạn!</p>`
    }
      </div>

      <p style="margin:0;color:#64748b;font-size:13px;line-height:1.7;">
        Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi. Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ thủ thư.
      </p>`;

  const subject = isOverdue
    ? `[Thư viện] ⚠️ Sách "${bookTitle}" đã quá hạn ${Math.abs(daysLeft)} ngày!`
    : `[Thư viện] Nhắc nhở: "${bookTitle}" ${daysLeft === 0 ? 'hết hạn hôm nay ⏰' : `còn ${daysLeft} ngày 📅`}`;

  const html = wrapEmail({
    headerBg,
    badgeColor: urgencyColor,
    badgeText: isOverdue ? 'Thông báo quá hạn' : 'Nhắc nhở trả sách',
    contentHtml,
    subject,
  });

  try {
    await createTransporter().sendMail({
      from: `"Thư Viện Văn Học Việt Nam" <${process.env.EMAIL_USER}>`,
      to: toEmail, subject, html,
    });
    console.log(`✅ Đã gửi email nhắc hạn tới ${toEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ Lỗi gửi email:`, error.message);
    return false;
  }
};

// ─── 2. Reservation Confirmation Email ────────────────────────────────────────
const sendReservationConfirmationEmail = async ({ toEmail, borrowerName, bookTitle, bookAuthor, coverImage, pickupDeadline }) => {
  if (!checkEmail()) return false;

  const deadlineFormatted = new Date(pickupDeadline).toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const contentHtml = `
      <p style="margin:0 0 8px;color:#1e293b;font-size:16px;font-weight:600;">Xin chào, <span style="color:#059669;">${borrowerName}</span> 🎉</p>
      <p style="margin:0 0 28px;color:#64748b;font-size:14px;line-height:1.7;">
        Yêu cầu đặt trước sách của bạn đã được <strong style="color:#059669;">xác nhận</strong>. Vui lòng đến thư viện để nhận sách trước thời hạn bên dưới.
      </p>

      <!-- Book Info Card -->
      <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:14px;overflow:hidden;margin-bottom:24px;">
        <div style="background:#065f46;padding:12px 20px;">
          <p style="margin:0;font-size:11px;color:#a7f3d0;text-transform:uppercase;letter-spacing:1px;font-weight:700;">✅ Đặt trước thành công</p>
        </div>
        <div style="padding:20px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              ${coverImage ? `<td style="padding-right:16px;vertical-align:top;"><img src="${coverImage}" alt="Bìa sách" width="64" style="border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.15);"/></td>` : ''}
              <td style="vertical-align:top;">
                <p style="margin:0 0 4px;font-size:18px;font-weight:800;color:#0f172a;">${bookTitle}</p>
                ${bookAuthor ? `<p style="margin:0 0 12px;font-size:13px;color:#64748b;">✍️ ${bookAuthor}</p>` : ''}
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Pickup Deadline -->
      <div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 6px;font-size:12px;color:#92400e;font-weight:700;text-transform:uppercase;letter-spacing:1px;">⏰ Hạn chót nhận sách</p>
        <p style="margin:0;font-size:22px;font-weight:800;color:#78350f;">${deadlineFormatted}</p>
        <p style="margin:8px 0 0;font-size:12px;color:#92400e;">Sách sẽ được giữ cho bạn đến hết ngày này</p>
      </div>

      <!-- Steps -->
      <div style="margin-bottom:28px;">
        <p style="margin:0 0 14px;font-size:14px;font-weight:700;color:#1e293b;">📋 Hướng dẫn nhận sách:</p>
        <table cellpadding="0" cellspacing="0" width="100%">
          ${[
      ['1', '#3b82f6', 'Mang thẻ thư viện hoặc CMND/CCCD đến quầy.'],
      ['2', '#8b5cf6', 'Thông báo mã đặt trước hoặc họ tên của bạn.'],
      ['3', '#059669', 'Ký nhận sách và hoàn tất thủ tục mượn.'],
    ].map(([no, color, text]) => `
          <tr>
            <td style="padding:6px 0;vertical-align:top;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:12px;vertical-align:top;">
                    <div style="width:28px;height:28px;border-radius:50%;background:${color};color:#fff;text-align:center;line-height:28px;font-size:13px;font-weight:800;">${no}</div>
                  </td>
                  <td style="vertical-align:middle;padding-top:4px;">
                    <p style="margin:0;font-size:14px;color:#374151;">${text}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`).join('')}
        </table>
      </div>

      <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
        Nếu bạn không thể đến nhận sách, vui lòng thông báo để chúng tôi hủy đặt trước. Cảm ơn bạn! 🙏
      </p>`;

  const subject = `[Thư viện] ✅ Xác nhận đặt trước: "${bookTitle}"`;

  const html = wrapEmail({
    headerBg: 'linear-gradient(135deg,#064e3b 0%,#065f46 50%,#047857 100%)',
    badgeColor: '#059669',
    badgeText: 'Xác nhận đặt trước sách',
    contentHtml,
    subject,
  });

  try {
    await createTransporter().sendMail({
      from: `"Thư Viện Văn Học Việt Nam" <${process.env.EMAIL_USER}>`,
      to: toEmail, subject, html,
    });
    console.log(`✅ Đã gửi email xác nhận đặt trước tới ${toEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ Lỗi gửi email xác nhận:`, error.message);
    return false;
  }
};

// ─── 3. Reservation Cancelled Email ───────────────────────────────────────────
const sendReservationCancelledEmail = async ({ toEmail, borrowerName, bookTitle, reason }) => {
  if (!checkEmail()) return false;

  const contentHtml = `
      <p style="margin:0 0 8px;color:#1e293b;font-size:16px;font-weight:600;">Xin chào, <span style="color:#dc2626;">${borrowerName}</span></p>
      <p style="margin:0 0 28px;color:#64748b;font-size:14px;line-height:1.7;">
        Yêu cầu đặt trước sách của bạn đã bị <strong style="color:#dc2626;">hủy</strong>.
      </p>
      <div style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:14px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:16px;font-weight:800;color:#0f172a;">📖 ${bookTitle}</p>
        ${reason ? `<p style="margin:0;font-size:14px;color:#7f1d1d;"><strong>Lý do:</strong> ${reason}</p>` : ''}
      </div>
      <p style="margin:0;color:#64748b;font-size:14px;line-height:1.7;">
        Bạn có thể đặt trước sách khác hoặc đến thư viện trực tiếp. Xin lỗi vì sự bất tiện này!
      </p>`;

  const html = wrapEmail({
    headerBg: 'linear-gradient(135deg,#7f1d1d 0%,#991b1b 100%)',
    badgeColor: '#dc2626',
    badgeText: 'Thông báo hủy đặt trước',
    contentHtml,
    subject: `[Thư viện] Đặt trước sách "${bookTitle}" đã bị hủy`,
  });

  try {
    await createTransporter().sendMail({
      from: `"Thư Viện Văn Học Việt Nam" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `[Thư viện] Đặt trước sách "${bookTitle}" đã bị hủy`,
      html,
    });
    return true;
  } catch (error) {
    console.error(`❌ Lỗi gửi email hủy đặt trước:`, error.message);
    return false;
  }
};

module.exports = { sendDueReminderEmail, sendReservationConfirmationEmail, sendReservationCancelledEmail };
