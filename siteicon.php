<?php

// Serves /<country>/img/custom/<icon>: the country's own icon from the mounted
// share when it has one, otherwise the shared default. A country therefore only
// has to supply the icons it actually changes, and new default icons reach every
// country without touching the share.
//
// mod_alias routes here rather than mod_rewrite: rewrite rules set in the server
// context are not inherited by the virtual host this runs in, while aliases are.

$types = [
    'png' => 'image/png',
    'svg' => 'image/svg+xml',
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'gif' => 'image/gif',
    'webp' => 'image/webp',
];

$path = isset($_SERVER['SCRIPT_NAME']) ? $_SERVER['SCRIPT_NAME'] : '';
$docRoot = isset($_SERVER['DOCUMENT_ROOT']) ? realpath($_SERVER['DOCUMENT_ROOT']) : false;

if ($docRoot === false
    || !preg_match('#^/([a-z]{2}(?:-[a-z]+)?)/img/custom/([A-Za-z0-9][A-Za-z0-9._/-]*)$#', $path, $m)
    || strpos($m[2], '..') !== false) {
    header('HTTP/1.1 404 Not Found');
    exit;
}

$extension = strtolower(pathinfo($m[2], PATHINFO_EXTENSION));
if (!isset($types[$extension])) {
    header('HTTP/1.1 404 Not Found');
    exit;
}

$candidates = [
    $docRoot . '/sites/' . $m[1] . '/img/' . $m[2],
    $docRoot . '/img/' . $m[2],
];

foreach ($candidates as $candidate) {
    $file = realpath($candidate);
    if ($file === false || !is_file($file)) continue;
    if (strpos($file, $docRoot . '/') !== 0) continue;

    $modified = filemtime($file);
    header('Content-Type: ' . $types[$extension]);
    header('Content-Length: ' . filesize($file));
    header('Cache-Control: public, max-age=3600');
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $modified) . ' GMT');

    if (isset($_SERVER['HTTP_IF_MODIFIED_SINCE'])
        && strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']) >= $modified) {
        header('HTTP/1.1 304 Not Modified');
        exit;
    }

    readfile($file);
    exit;
}

header('HTTP/1.1 404 Not Found');
