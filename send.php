<?php
/* Приём заявок с форм сайта (Бегет, PHP). Отправляет письмо на почту компании.
   Принимает multipart/form-data (с файлами для страницы «Строительным компаниям»).
   Отвечает JSON. */
header('Content-Type: application/json; charset=utf-8');

// TODO: уточнить у заказчика, на какую почту отправлять заявки
$TO   = 'km89r@mail.ru';
// Адрес отправителя должен быть почтой на домене сайта (иначе письма уходят в спам). Поменять после привязки домена.
$FROM = 'noreply@' . preg_replace('/^www\./', '', $_SERVER['HTTP_HOST'] ?? 'art-stone.site');
$MAX_FILE = 25 * 1024 * 1024;
$ALLOWED  = ['pdf', 'dwg', 'jpg', 'jpeg', 'zip'];

function fail($code, $msg) { http_response_code($code); echo json_encode(['ok' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE); exit; }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'method');
if (!empty($_POST['website'])) { echo json_encode(['ok' => true]); exit; } // ловушка для ботов

$clean = function ($v) { return trim(strip_tags((string)$v)); };
$form = $clean($_POST['form'] ?? ($_POST['_subject'] ?? 'Заявка'));
$phone = $clean($_POST['Phone'] ?? ($_POST['phone'] ?? ''));
if (strlen(preg_replace('/\D/', '', $phone)) < 10) fail(422, 'phone');

$lines = [];
foreach ($_POST as $k => $v) {
    if (is_array($v)) $v = implode(', ', $v);
    $lines[] = $clean($k) . ': ' . $clean($v);
}
$body = "Заявка с сайта " . ($_SERVER['HTTP_HOST'] ?? '') . "\n\n" . implode("\n", $lines) . "\n";

$subject = '=?UTF-8?B?' . base64_encode('Заявка с сайта АртСтон: ' . $form) . '?=';
$boundary = md5(uniqid('', true));
$headers = "From: АртСтон <$FROM>\r\nReply-To: $FROM\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=\"$boundary\"\r\n";

$msg = "--$boundary\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($body)) . "\r\n";

foreach ($_FILES as $f) {
    if (empty($f['name']) || $f['error'] !== UPLOAD_ERR_OK) continue;
    $ext = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $ALLOWED, true) || $f['size'] > $MAX_FILE) fail(422, 'file');
    $name = '=?UTF-8?B?' . base64_encode(basename($f['name'])) . '?=';
    $msg .= "--$boundary\r\nContent-Type: application/octet-stream; name=\"$name\"\r\nContent-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename=\"$name\"\r\n\r\n"
          . chunk_split(base64_encode(file_get_contents($f['tmp_name']))) . "\r\n";
}
$msg .= "--$boundary--";

if (!mail($TO, $subject, $msg, $headers)) fail(500, 'mail');
echo json_encode(['ok' => true]);
