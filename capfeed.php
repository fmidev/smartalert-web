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
$address = $protocol . "://" . $host . ($dir ? $dir . "/" : "");

// Full feed URL
$capfeed = $protocol . "://" . $host . $script_name;

foreach ($SUBDIRS as $dir) {
    $DIR = trim(shell_exec("find data/$dir/publishedCap -type d|sort -n|tail -1"));
    if (!$DIR || !is_dir($DIR)) continue; // Skip if $DIR is empty or not a directory

    $FILES = scandir($DIR);
    foreach ($FILES as $file) {
        if (preg_match("/_ALERT_/", $file) || preg_match("/_UPDATE_/", $file)) {
            $content = file_get_contents($DIR . "/" . $file);
            $xml = new SimpleXmlElement($content);
            $senderName = (string) $xml->info->senderName;

            if (time() > strtotime((string) $xml->info->expires)) {
                continue;
            }

            $atom .= "<entry>\n";
            $atom .= "<id>$address" . $DIR . "/" . $file . "</id>\n";
            $atom .= "<title>" . $xml->info->event . " for " . htmlspecialchars($xml->info->area->areaDesc, ENT_XML1, 'UTF-8') . " issued " . date('F j \a\t g:i A T', strtotime($xml->info->onset)) . " until " . date('F j \a\t g:i A T', strtotime($xml->info->expires)) . " </title>\n";
            $atom .= "<summary>" . htmlspecialchars($xml->info->description, ENT_XML1, 'UTF-8') . "</summary>\n";
            $atom .= "<cap:effective>" . $xml->info->effective . "</cap:effective>\n";
            $atom .= "<cap:expires>" . $xml->info->expires . "</cap:expires>\n";
            $atom .= "<updated>" . $xml->sent . "</updated>\n";
            $updated = date("c", filemtime($DIR . "/" . $file));
            $atom .= '<link rel="related" type="application/cap+xml" href="' . $address . $DIR . "/" . $file . '"/>' . "\n";
            $atom .= "</entry>\n";
        }
    }
}

if ($atom === "") {
    $updated = date("c", time());
    $atom = <<<EOT
<entry>
<id>$capfeed</id>
<updated>$updated</updated>
<author>
<name>$senderName</name>
</author>
<title>There are no active watches, warnings or advisories</title>
<link href='$capfeed'/>
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
  issued by the $senderName. This index file
  is not the complete Common Alerting Protocol (CAP) alert message. To obtain
  the complete CAP alert, please follow the links for each entry in this index.
  Not all information in the CAP message is contained in this index of active
  alerts.
-->

<feed 
  xmlns="http://www.w3.org/2005/Atom"
  xmlns:cap="urn:oasis:names:tc:emergency:cap:1.2"
  xmlns:ha="http://www.alerting.net/namespace/index_1.0">

  <link href="$capfeed" rel="self"/>
  <rights> Copyright, $senderName. Licensed under CC BY 4.0 </rights>
  <id>$capfeed</id>
  <generator>$senderName</generator>
  <updated>$updated</updated>
  <author>
     <name>$senderName</name>
  </author>
  <title>Current Watches, Warnings and Advisories Issued by $senderName</title>
$atom
</feed>
EOT;
?>
