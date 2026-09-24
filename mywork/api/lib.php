<?php
// Shared helpers for the MyWork API (index.php) and HR admin page (admin.php).
// Works on PHP 8.0+ with the pdo_mysql, fileinfo and session extensions.
declare(strict_types=1);

function cfg(): array
{
    static $config = null;
    if ($config === null) {
        $file = __DIR__ . '/config.php';
        if (!is_file($file)) {
            json_fail(500, 'The server is not set up yet: copy api/config.sample.php to api/config.php.');
        }
        $config = require $file;
    }
    return $config;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $d = cfg()['db'];
        $dsn = !empty($d['socket'])
            ? "mysql:unix_socket={$d['socket']};dbname={$d['name']};charset=utf8mb4"
            : "mysql:host={$d['host']};port={$d['port']};dbname={$d['name']};charset=utf8mb4";
        try {
            $pdo = new PDO($dsn, $d['user'], $d['pass'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            error_log('MyWork DB connection failed: ' . $e->getMessage());
            json_fail(503, "Can't connect to the database. Check the db settings in api/config.php.");
        }
        $pdo->exec("SET time_zone = '+00:00'");
    }
    return $pdo;
}

function q(string $sql, array $params = []): PDOStatement
{
    $st = db()->prepare($sql);
    $st->execute($params);
    return $st;
}

function json_out($data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_fail(int $code, string $message): void
{
    json_out(['error' => $message], $code);
}

function start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $https = !empty(cfg()['https_only_cookies']);
    session_name('MYWORKSESSID');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $https,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

/** Current UTC time as a DATETIME string. */
function now_utc(): string
{
    return gmdate('Y-m-d H:i:s');
}

/** Today's date in the company's time zone. */
function company_today(): string
{
    $tz = new DateTimeZone(cfg()['timezone'] ?? 'Asia/Jakarta');
    return (new DateTime('now', $tz))->format('Y-m-d');
}

/** UTC DATETIME string → milliseconds since epoch (what the app uses). */
function ms(?string $utc): ?int
{
    return $utc ? (int) (strtotime($utc . ' UTC') * 1000) : null;
}

function valid_date(string $s): bool
{
    $d = DateTime::createFromFormat('!Y-m-d', $s);
    return $d !== false && $d->format('Y-m-d') === $s;
}

function days_between(string $from, string $to): int
{
    return (int) (new DateTime($from))->diff(new DateTime($to))->days + 1;
}

function client_ip(): string
{
    return substr($_SERVER['REMOTE_ADDR'] ?? '', 0, 45);
}

// ---- File storage -------------------------------------------------------------

const ALLOWED_TYPES = [
    'pdf' => 'application/pdf',
    'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'gif' => 'image/gif', 'webp' => 'image/webp',
    'doc' => 'application/msword',
    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls' => 'application/vnd.ms-excel',
    'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

function storage_path(string $folder, string $stored = ''): string
{
    $dir = rtrim(cfg()['storage_dir'] ?? (__DIR__ . '/storage'), '/') . '/' . $folder;
    if (!is_dir($dir) && !mkdir($dir, 0750, true) && !is_dir($dir)) {
        json_fail(500, 'The upload folder is not writable. Check storage_dir in api/config.php.');
    }
    return $stored === '' ? $dir : $dir . '/' . basename($stored);
}

/**
 * Validate and save an uploaded file. Returns [stored_name, original_name, size]
 * or null when no file was sent.
 */
function save_upload(string $field, string $folder): ?array
{
    if (empty($_FILES[$field]) || ($_FILES[$field]['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    $f = $_FILES[$field];
    $maxMb = (int) (cfg()['max_upload_mb'] ?? 10);
    if ($f['error'] === UPLOAD_ERR_INI_SIZE || $f['error'] === UPLOAD_ERR_FORM_SIZE || $f['size'] > $maxMb * 1048576) {
        json_fail(413, "Files must be {$maxMb} MB or smaller.");
    }
    if ($f['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) {
        json_fail(400, 'The upload did not complete. Please try again.');
    }
    $original = trim(str_replace(["\0", '/', '\\'], '', (string) $f['name'])) ?: 'file';
    $ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));
    if (!isset(ALLOWED_TYPES[$ext])) {
        json_fail(415, 'Only PDF, image, Word and Excel files can be uploaded.');
    }
    $stored = bin2hex(random_bytes(16)) . '.' . $ext;
    if (!move_uploaded_file($f['tmp_name'], storage_path($folder, $stored))) {
        json_fail(500, 'Could not save the file. Check that storage_dir is writable.');
    }
    return [$stored, mb_substr($original, 0, 255), (int) $f['size']];
}

function send_file(string $folder, string $stored, string $downloadName, bool $download): void
{
    $path = storage_path($folder, $stored);
    if (!is_file($path)) {
        json_fail(404, 'This file is no longer available.');
    }
    $ext = strtolower(pathinfo($stored, PATHINFO_EXTENSION));
    $type = ALLOWED_TYPES[$ext] ?? 'application/octet-stream';
    $safe = preg_replace('/[^\w.\- ]+/u', '_', $downloadName);
    header('Content-Type: ' . $type);
    header('Content-Length: ' . filesize($path));
    header('X-Content-Type-Options: nosniff');
    header("Content-Security-Policy: default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox");
    header('Cache-Control: private, no-store');
    header(sprintf('Content-Disposition: %s; filename="%s"; filename*=UTF-8\'\'%s',
        $download ? 'attachment' : 'inline', $safe, rawurlencode($downloadName)));
    readfile($path);
    exit;
}

function delete_stored(string $folder, ?string $stored): void
{
    if ($stored) {
        $path = storage_path($folder, $stored);
        if (is_file($path)) {
            @unlink($path);
        }
    }
}
