<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

// =====================================================
// ⚙️ CẤU HÌNH GMAIL SMTP
// =====================================================
// Bước 1: Bật xác minh 2 bước (2-Step Verification) tại:
//         https://myaccount.google.com/security
// Bước 2: Tạo App Password tại:
//         https://myaccount.google.com/apppasswords
//         Chọn "Mail" → "Other" → Đặt tên "KhanhLinhShop" → Copy mật khẩu 16 ký tự
// Bước 3: Dán mật khẩu đó vào dòng GMAIL_APP_PASSWORD bên dưới (thay chỗ xxxx)
// =====================================================

define('GMAIL_ADDRESS',      'khanhlinh19695@gmail.com');       // Email nhận đơn hàng
define('GMAIL_APP_PASSWORD', 'rfoq azmy nvaj mcmr');       // ← DÁN APP PASSWORD VÀO ĐÂY
define('SHOP_NAME',          'Khánh Linh Shop');

// =====================================================
// Nhận dữ liệu từ form
// =====================================================
$inputJSON = file_get_contents('php://input');
$data = json_decode($inputJSON, true);
if (!$data) $data = $_POST;

if (empty($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No data received']);
    exit;
}

$fullname = isset($data['full_name']) ? trim($data['full_name']) : '';
$phone    = isset($data['phone_number']) ? trim($data['phone_number']) : '';
$address  = isset($data['address']) ? trim($data['address']) : '';
$province = isset($data['province_id']) ? trim($data['province_id']) : '';
$district = isset($data['district_id']) ? trim($data['district_id']) : '';
$commune  = isset($data['commune_id']) ? trim($data['commune_id']) : '';
$combo    = isset($data['combo']) ? trim($data['combo']) : '';
$colors   = isset($data['colors']) ? $data['colors'] : '';
$size     = isset($data['size']) ? trim($data['size']) : '';
$note     = isset($data['textarea_input_1']) ? trim($data['textarea_input_1']) : '';

// Validation
$errors = [];
if (empty($fullname)) $errors['full_name'] = 'Vui lòng nhập họ tên';
if (empty($phone))    $errors['phone_number'] = 'Vui lòng nhập số điện thoại';
elseif (!preg_match('/^(0[3|5|7|8|9])+([0-9]{8})$/', $phone))
    $errors['phone_number'] = 'Số điện thoại không hợp lệ';
if (empty($address))  $errors['address'] = 'Vui lòng nhập địa chỉ';

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit;
}

// Format
$colorStr = is_array($colors) ? implode(', ', $colors) : $colors;
$fullAddress = $address;
if ($commune)  $fullAddress .= ', ' . $commune;
if ($district) $fullAddress .= ', ' . $district;
if ($province) $fullAddress .= ', ' . $province;

// =====================================================
// Nội dung Email HTML
// =====================================================
$subject = '🛒 Đơn hàng mới - ' . $fullname . ' - ' . $phone;

$message = "
<html>
<head><meta charset='UTF-8'><title>Đơn hàng mới</title></head>
<body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
  <div style='background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;'>
    <h2 style='margin:0;'>🛒 ĐƠN HÀNG MỚI</h2>
    <p style='margin:5px 0 0;'>" . SHOP_NAME . " - Áo Min</p>
  </div>
  <div style='border: 1px solid #ddd; padding: 20px; border-radius: 0 0 8px 8px;'>
    <table cellpadding='8' cellspacing='0' style='width:100%; border-collapse:collapse;'>
      <tr style='border-bottom:1px solid #eee;'>
        <td style='font-weight:bold; width:140px; color:#555;'>👤 Khách hàng</td>
        <td>" . htmlspecialchars($fullname) . "</td>
      </tr>
      <tr style='border-bottom:1px solid #eee;'>
        <td style='font-weight:bold; color:#555;'>📱 Số điện thoại</td>
        <td><a href='tel:" . htmlspecialchars($phone) . "'>" . htmlspecialchars($phone) . "</a></td>
      </tr>
      <tr style='border-bottom:1px solid #eee;'>
        <td style='font-weight:bold; color:#555;'>📍 Địa chỉ</td>
        <td>" . htmlspecialchars($fullAddress) . "</td>
      </tr>
      <tr style='border-bottom:1px solid #eee;'>
        <td style='font-weight:bold; color:#555;'>📦 Combo</td>
        <td style='color:#e74c3c; font-weight:bold;'>" . htmlspecialchars($combo) . "</td>
      </tr>
      <tr style='border-bottom:1px solid #eee;'>
        <td style='font-weight:bold; color:#555;'>🎨 Màu sắc</td>
        <td>" . htmlspecialchars($colorStr) . "</td>
      </tr>
      <tr style='border-bottom:1px solid #eee;'>
        <td style='font-weight:bold; color:#555;'>📏 Size</td>
        <td>" . htmlspecialchars($size) . "</td>
      </tr>
      <tr style='border-bottom:1px solid #eee;'>
        <td style='font-weight:bold; color:#555;'>📝 Ghi chú</td>
        <td>" . htmlspecialchars($note ?: 'Không có') . "</td>
      </tr>
    </table>
    <hr style='margin:15px 0; border:none; border-top:1px solid #eee;'>
    <p style='font-size:12px; color:#999; text-align:center;'>Đơn hàng được gửi từ website " . SHOP_NAME . " lúc " . date('H:i d/m/Y') . "</p>
  </div>
</body>
</html>
";

// =====================================================
// Gửi Email bằng PHPMailer + Gmail SMTP
// =====================================================
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/PHPMailer/Exception.php';
require __DIR__ . '/PHPMailer/PHPMailer.php';
require __DIR__ . '/PHPMailer/SMTP.php';

$mailSent = false;
$mailError = '';

try {
    $mail = new PHPMailer(true);
    
    // SMTP Config
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = GMAIL_ADDRESS;
    $mail->Password   = GMAIL_APP_PASSWORD;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;
    $mail->CharSet    = 'UTF-8';
    
    // Sender & Recipient
    $mail->setFrom(GMAIL_ADDRESS, SHOP_NAME);
    $mail->addAddress(GMAIL_ADDRESS); // Gửi cho chính mình
    
    // Content
    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body    = $message;
    $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $message));
    
    $mail->send();
    $mailSent = true;
    
} catch (Exception $e) {
    $mailError = $mail->ErrorInfo;
}

// Save order to local backup file
$orderLine = date('Y-m-d H:i:s')
    . " | " . $fullname
    . " | " . $phone
    . " | " . $fullAddress
    . " | Combo: " . $combo
    . " | Màu: " . $colorStr
    . " | Size: " . $size
    . " | Note: " . $note
    . "\n";
@file_put_contents('orders.log', $orderLine, FILE_APPEND | LOCK_EX);

echo json_encode([
    'success' => true,
    'message' => 'Đặt hàng thành công!',
    'email_sent' => $mailSent,
    'email_error' => $mailError
]);
?>
