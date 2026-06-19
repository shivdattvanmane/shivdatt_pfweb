<?php
$file="feedback_data.csv";
if(!file_exists($file)) file_put_contents($file,"Name,City,Feedback\n");
file_put_contents($file,$_POST['name'].",".$_POST['city'].",".$_POST['feedback']."\n",FILE_APPEND);
echo "Feedback saved successfully";
?>