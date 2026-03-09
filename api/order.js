// Vercel Serverless Function: /api/order.js
// Handles POST requests for order submission on Vercel deployment.
// Uses Nodemailer + Gmail SMTP identical in logic to process_order.php.
//
// SETUP:
// In Vercel Dashboard → Project Settings → Environment Variables, add:
//   GMAIL_ADDRESS      = yasuaola@gmail.com
//   GMAIL_APP_PASSWORD = xxxx xxxx xxxx xxxx   (your 16-char Gmail App Password)

const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
    // Allow CORS for InfinityFree domain too if needed
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    const data = req.body;

    if (!data) {
        return res.status(400).json({ success: false, message: 'No data received' });
    }

    const fullname = (data.full_name || '').trim();
    const phone = (data.phone_number || '').trim();
    const address = (data.address || '').trim();
    const province = (data.province_id || '').trim();
    const district = (data.district_id || '').trim();
    const commune = (data.commune_id || '').trim();
    const combo = (data.combo || '').trim();
    const size = (data.size || '').trim();
    const note = (data.textarea_input_1 || '').trim();

    // Colors may be sent as array or comma-separated string
    let colors = data['colors[]'] || data.colors || [];
    if (typeof colors === 'string') colors = colors.split(',').map(c => c.trim());
    const colorStr = Array.isArray(colors) ? colors.join(', ') : colors;

    // Basic validation
    const errors = {};
    if (!fullname) errors.full_name = 'Vui lòng nhập họ tên';
    if (!phone) errors.phone_number = 'Vui lòng nhập số điện thoại';
    if (!address) errors.address = 'Vui lòng nhập địa chỉ';

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    const fullAddress = [address, commune, district, province].filter(Boolean).join(', ');

    const subject = `🛒 Đơn hàng mới - ${fullname} - ${phone}`;
    const htmlBody = `
<html><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#e74c3c,#c0392b);color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;">🛒 ĐƠN HÀNG MỚI</h2>
    <p style="margin:5px 0 0;">Khánh Linh Shop – Áo Min</p>
  </div>
  <div style="border:1px solid #ddd;padding:20px;border-radius:0 0 8px 8px;">
    <table cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse;">
      <tr style="border-bottom:1px solid #eee;"><td style="font-weight:bold;color:#555;width:140px;">👤 Khách hàng</td><td>${fullname}</td></tr>
      <tr style="border-bottom:1px solid #eee;"><td style="font-weight:bold;color:#555;">📱 Số ĐT</td><td><a href="tel:${phone}">${phone}</a></td></tr>
      <tr style="border-bottom:1px solid #eee;"><td style="font-weight:bold;color:#555;">📍 Địa chỉ</td><td>${fullAddress}</td></tr>
      <tr style="border-bottom:1px solid #eee;"><td style="font-weight:bold;color:#555;">📦 Combo</td><td style="color:#e74c3c;font-weight:bold;">${combo}</td></tr>
      <tr style="border-bottom:1px solid #eee;"><td style="font-weight:bold;color:#555;">🎨 Màu sắc</td><td>${colorStr}</td></tr>
      <tr style="border-bottom:1px solid #eee;"><td style="font-weight:bold;color:#555;">📏 Size</td><td>${size}</td></tr>
      <tr><td style="font-weight:bold;color:#555;">📝 Ghi chú</td><td>${note || 'Không có'}</td></tr>
    </table>
    <hr style="margin:15px 0;border:none;border-top:1px solid #eee;">
    <p style="font-size:12px;color:#999;text-align:center;">Đơn hàng gửi từ Khánh Linh Shop lúc ${new Date().toLocaleString('vi-VN')}</p>
  </div>
</body></html>`;

    const GMAIL_ADDRESS = process.env.GMAIL_ADDRESS;
    const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

    let emailSent = false;
    let emailError = '';

    if (GMAIL_ADDRESS && GMAIL_APP_PASSWORD) {
        try {
            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: { user: GMAIL_ADDRESS, pass: GMAIL_APP_PASSWORD },
            });

            await transporter.sendMail({
                from: `"Khánh Linh Shop" <${GMAIL_ADDRESS}>`,
                to: GMAIL_ADDRESS,
                subject,
                html: htmlBody,
            });
            emailSent = true;
        } catch (err) {
            emailError = err.message;
        }
    } else {
        emailError = 'Gmail credentials not configured in environment variables';
    }

    return res.status(200).json({
        success: true,
        message: 'Đặt hàng thành công!',
        email_sent: emailSent,
        email_error: emailError,
    });
};
