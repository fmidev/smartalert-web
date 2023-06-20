<?php
$SUBDIRS = [""]; # if no subdirectories are needed
#$SUBDIRS = ["meteorology", "hydrology"];

$atom="";
$updated;

$protocol=$_SERVER['PROTOCOL'] = isset($_SERVER['HTTPS']) && !empty($_SERVER['HTTPS']) ? 'https' : 'http';

$address = $protocol."://".$_SERVER['SERVER_NAME'].dirname($_SERVER['PHP_SELF'])."/";
$capfeed = $protocol."://".$_SERVER['SERVER_NAME'].$_SERVER['PHP_SELF'];


foreach($SUBDIRS as $dir) {
  $DIR=trim(`find data/$dir/publishedCap -type d|sort -n|tail -1`);
  $FILES = scandir($DIR);

  foreach ($FILES as $file) {
      if (preg_match("/_ALERT_/",$file) || preg_match("/_UPDATE_/",$file)) {
        $content = file_get_contents($DIR."/".$file);
        $xml = new SimpleXmlElement($content);
        $senderName = $xml->info->senderName;
        if (time() > strtotime($xml->info->expires))
          continue;
        $atom .= "<entry>\n";
        $atom .= "<id>$address".$DIR."/".$file."</id>\n";
        $atom .= "<title>".$xml->info->event." for ".preg_replace("/\&/","&amp;",$xml->info->area->areaDesc)  ." issued ". date('F j \a\t g:i A T',strtotime($xml->info->onset)) ." until " . date('F j \a\t g:i A T',strtotime($xml->info->expires)) ." </title>\n";
        $atom .= "<summary>".preg_replace("/\&/","&amp;",$xml->info->description)."</summary>\n";
        $atom .= "<cap:effective>".$xml->info->effective."</cap:effective>\n";
        $atom .= "<cap:expires>".$xml->info->expires."</cap:expires>\n";
        $atom .= "<updated>".$xml->sent."</updated>\n";
        $updated = date("c",filemtime($DIR."/".$file));
        $atom .= '<link rel="related" type="application/cap+xml" href="'.$address.$DIR."/".$file.'"/>'."\n";
        $atom .= "</entry>\n";

      }
    }
  }

if ($atom === "")
  {
    $updated = date("c",time());
$atom=<<<EOT
<entry>
<id>$capfeed</id>
<updated>$updated</updated>
<author>
<name>$sender</name>
</author>
<title>There are no active watches, warnings or advisories</title>
  <link href='$capfeed'/>
  <summary>There are no active watches, warnings or advisories</summary>
  </entry>
EOT;
  }
header("Content-type: application/xml");
print<<<EOT
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<!--?xml-stylesheet href='capatom.xsl' type='text/xsl'?-->
<!--
  This atom/xml feed is an index to active advisories, watches and warnings
  issued by the $senderName.  This index file
  is not the complete Common Alerting Protocol (CAP) alert message.  To obtain
  the complete CAP alert, please follow the links for each entry in this index.
  Not all information in the CAP message is contained in this index of active
  alerts.
-->

<feed 
  xmlns="http://www.w3.org/2005/Atom"
  xmlns:cap = "urn:oasis:names:tc:emergency:cap:1.2"
  xmlns:ha = "http://www.alerting.net/namespace/index_1.0">

  <link href="$capfeed" rel="self"/>
  <id>$capfeed</id>
  <generator>$senderName</generator>
  <updated>$updated</updated>
  <author>
     <name>$xml->sender</name>
  </author>
  <title>Current Watches, Warnings and Advisories Issued by $senderName</title>
$atom
</feed>
EOT;
