<?php
$file="hr_requests.csv";
if(!file_exists($file)) file_put_contents($file,"HR,Email,Company,Message\n");
file_put_contents($file,$_POST['hrname'].",".$_POST['email'].",".$_POST['company'].",".$_POST['message']."\n",FILE_APPEND);
echo "HR request sent successfully";
?>