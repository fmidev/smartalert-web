<?php

$SUBDIRS = [];
$basePath = __DIR__ . "/data";
$directCap = "$basePath/publishedCap";

if (is_dir($directCap)) {
    // If "data/publishedCap" exists, just use that
    $SUBDIRS[] = "";
} else {
    // Otherwise, auto-discover subdirectories under "data/" containing "publishedCap"
    foreach (scandir($basePath) as $d) {
        if ($d === "." || $d === "..") continue;
        if (is_dir("$basePath/$d/publishedCap")) {
            $SUBDIRS[] = $d;
        }
    }
}

$atom = "";
$updated = "";
$senderName = "Default Sender"; // Initialize senderName with a default value

$is_https = (
    (!empty($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS']) !== 'off')
    || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443)
    || (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower($_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https')
);

$protocol = $is_https ? 'https' : 'http';

// Prefer HTTP_HOST (includes port if needed), fallback to SERVER_NAME
if (isset($_SERVER['HTTP_HOST'])) {
    $host = $_SERVER['HTTP_HOST'];
} elseif (isset($_SERVER['SERVER_NAME'])) {
    $host = $_SERVER['SERVER_NAME'];
} else {
    $host = 'localhost';
}

// Ensure directory path is clean
$script_name = isset($_SERVER['PHP_SELF']) ? $_SERVER['PHP_SELF'] : '';
$dir = rtrim(str_replace('\\', '/', dirname($script_name)), '/');
$address = $protocol . "://" . $host . $dir . "/";

// Full feed URL
$capfeed = $protocol . "://" . $host . $script_name;

function findLatestCapDir(string $root): ?string {
    if (!is_dir($root)) return null;
    $latest = $root;
    $it = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );
    foreach ($it as $fileInfo) {
        if ($fileInfo->isDir()) {
            $path = $fileInfo->getPathname();
            if (strcmp($path, $latest) > 0) $latest = $path;
        }
    }
    return $latest;
}

foreach ($SUBDIRS as $subdir) {
    $relRoot = $subdir === "" ? "data/publishedCap" : "data/$subdir/publishedCap";
    $absDir = findLatestCapDir(__DIR__ . "/" . $relRoot);
    if ($absDir === null) continue;

    // Filesystem reads use the absolute path (independent of the PHP CWD);
    // the relative form is what goes into the <id>/<link> URLs.
    $relDir = substr($absDir, strlen(__DIR__) + 1);

    $FILES = scandir($absDir);
    foreach ($FILES as $file) {
        if (preg_match("/_ALERT_/", $file) || preg_match("/_UPDATE_/", $file)) {
            $content = file_get_contents($absDir . "/" . $file);
            $xml = new SimpleXmlElement($content);
            $senderName = (string) $xml->info->senderName;

            if (time() > strtotime((string) $xml->info->expires)) {
                continue;
            }

            $entryUrl = htmlspecialchars($address . $relDir . "/" . $file, ENT_XML1 | ENT_QUOTES, 'UTF-8');
            $atom .= "<entry>\n";
            $atom .= "<id>" . $entryUrl . "</id>\n";
            $atom .= "<title>" . htmlspecialchars((string) $xml->info->event, ENT_XML1 | ENT_QUOTES, 'UTF-8') . " for " . htmlspecialchars($xml->info->area->areaDesc, ENT_XML1 | ENT_QUOTES, 'UTF-8') . " issued " . date('F j \a\t g:i A T', strtotime($xml->info->onset)) . " until " . date('F j \a\t g:i A T', strtotime($xml->info->expires)) . " </title>\n";
            $atom .= "<summary>" . htmlspecialchars($xml->info->description, ENT_XML1 | ENT_QUOTES, 'UTF-8') . "</summary>\n";
            $atom .= "<cap:effective>" . htmlspecialchars((string) $xml->info->effective, ENT_XML1 | ENT_QUOTES, 'UTF-8') . "</cap:effective>\n";
            $atom .= "<cap:expires>" . htmlspecialchars((string) $xml->info->expires, ENT_XML1 | ENT_QUOTES, 'UTF-8') . "</cap:expires>\n";
            $atom .= "<updated>" . htmlspecialchars((string) $xml->sent, ENT_XML1 | ENT_QUOTES, 'UTF-8') . "</updated>\n";
            $updated = date("c", filemtime($absDir . "/" . $file));
            $atom .= '<link rel="related" type="application/cap+xml" href="' . $entryUrl . '"/>' . "\n";
            $atom .= "</entry>\n";
        }
    }
}

$senderNameEsc = htmlspecialchars($senderName, ENT_XML1 | ENT_QUOTES, 'UTF-8');
$capfeedEsc = htmlspecialchars($capfeed, ENT_XML1 | ENT_QUOTES, 'UTF-8');

if ($atom === "") {
    $updated = date("c", time());
    $atom = <<<EOT
<entry>
<id>$capfeedEsc</id>
<updated>$updated</updated>
<author>
<name>$senderNameEsc</name>
</author>
<title>There are no active watches, warnings or advisories</title>
<link href="$capfeedEsc"/>
<summary>There are no active watches, warnings or advisories</summary>
</entry>
EOT;
}

header("Content-type: application/xml");
echo <<<EOT
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<!--?xml-stylesheet href='capatom.xsl' type='text/xsl'?-->
<!--
  This atom/xml feed is an index to active advisories, watches and warnings
  issued by the $senderNameEsc. This index file
  is not the complete Common Alerting Protocol (CAP) alert message. To obtain
  the complete CAP alert, please follow the links for each entry in this index.
  Not all information in the CAP message is contained in this index of active
  alerts.
-->

<feed
  xmlns="http://www.w3.org/2005/Atom"
  xmlns:cap="urn:oasis:names:tc:emergency:cap:1.2"
  xmlns:ha="http://www.alerting.net/namespace/index_1.0">

  <link href="$capfeedEsc" rel="self"/>
  <rights> Copyright, $senderNameEsc. Licensed under CC BY 4.0 </rights>
  <id>$capfeedEsc</id>
  <generator>$senderNameEsc</generator>
  <updated>$updated</updated>
  <author>
     <name>$senderNameEsc</name>
  </author>
  <title>Current Watches, Warnings and Advisories Issued by $senderNameEsc</title>
$atom
</feed>
EOT;
?>
