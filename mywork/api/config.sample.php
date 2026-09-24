<?php
// MyWork API settings. Copy this file to config.php (same folder) and fill it in.
// config.php holds passwords: never commit it or share it.
return [
    'db' => [
        // Synology "MariaDB 10" package: host 127.0.0.1, port 3307.
        // (Or set 'socket' => '/run/mysqld/mysqld10.sock' and it is used instead of host/port.)
        'host'   => '127.0.0.1',
        'port'   => 3307,
        'socket' => '',
        'name'   => 'mywork',
        'user'   => 'mywork',
        'pass'   => 'CHANGE-ME',
    ],

    // Company time zone: decides which day a check-in belongs to.
    'timezone' => 'Asia/Jakarta',

    // Where uploaded documents and request attachments are saved.
    // Best outside the web folder, e.g. '/volume1/mywork-files' (add it to the PHP
    // profile's open_basedir in Web Station). The default below is inside /api and is
    // protected by random file names plus api/storage/.htaccess.
    'storage_dir' => __DIR__ . '/storage',

    'max_upload_mb' => 10,

    // Password for the HR admin page (api/admin.php). At least 12 characters.
    'admin_password' => '',

    // Set to true when the site is served over HTTPS (recommended), so the
    // sign-in cookie is only sent over encrypted connections.
    'https_only_cookies' => false,
];
