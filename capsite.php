<?php

// The CAP endpoints exist once and are shared by every country. In the
// OpenShift image they are reached as /<country>/list.php through an Apache
// alias, so __DIR__ points at the shared copy rather than at the site being
// served, and the site's own files live on a mounted share under sites/.
//
// Resolve the site from the URL the request arrived on:
//   /ge/list.php -> <document root>/sites/ge   (mounted share)
//   /ge/list.php -> <document root>/ge         (share mounted at the root)
//   /list.php    -> <document root>            (single-site install)
function capSiteDir()
{
    static $resolved = null;
    if ($resolved !== null) return $resolved;

    $resolved = __DIR__;

    $docRoot = isset($_SERVER['DOCUMENT_ROOT']) ? realpath($_SERVER['DOCUMENT_ROOT']) : false;
    $scriptName = isset($_SERVER['SCRIPT_NAME']) ? $_SERVER['SCRIPT_NAME'] : '';
    if ($docRoot === false || $scriptName === '') return $resolved;

    $urlDir = ltrim(str_replace('\\', '/', dirname($scriptName)), '/');
    if ($urlDir === '') {
        $resolved = $docRoot;
        return $resolved;
    }

    foreach (["$docRoot/sites/$urlDir", "$docRoot/$urlDir"] as $candidate) {
        $real = realpath($candidate);
        if ($real === false) continue;
        if (strpos($real, $docRoot . '/') !== 0) continue;
        $resolved = $real;
        return $resolved;
    }

    return $resolved;
}
