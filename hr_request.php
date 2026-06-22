<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $hrname = isset($_POST['hrname']) ? strip_tags(trim($_POST['hrname'])) : '';
    $email = isset($_POST['email']) ? strip_tags(trim($_POST['email'])) : '';
    $company = isset($_POST['company']) ? strip_tags(trim($_POST['company'])) : '';
    $msg = isset($_POST['message']) ? strip_tags(trim($_POST['message'])) : '';

    if (!empty($hrname) && !empty($email) && !empty($msg)) {
        
        // 1. Save to Local SQLite Database (strictly on the server)
        try {
            $db = new SQLite3('portfolio.db');
            
            // Create table if not exists
            $db->exec("CREATE TABLE IF NOT EXISTS hr_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hrname TEXT NOT NULL,
                email TEXT NOT NULL,
                company TEXT NOT NULL,
                message TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )");

            // Insert using prepared statement for security
            $stmt = $db->prepare("INSERT INTO hr_requests (hrname, email, company, message) VALUES (:hrname, :email, :company, :message)");
            $stmt->bindValue(':hrname', $hrname, SQLITE3_TEXT);
            $stmt->bindValue(':email', $email, SQLITE3_TEXT);
            $stmt->bindValue(':company', $company, SQLITE3_TEXT);
            $stmt->bindValue(':message', $msg, SQLITE3_TEXT);
            $stmt->execute();
            $db->close();
        } catch (Exception $e) {
            // Silently handle DB errors to avoid leaking paths to client
            error_log("SQLite database error: " . $e->getMessage());
        }

        // 2. Send Email Notification
        $to = "shivdattvanmane@gmail.com";
        $subject = "New HR Inquiry from " . $hrname . " (" . $company . ")";
        
        $message = "You have received a new HR / Job Inquiry on your portfolio website:\n\n";
        $message .= "HR Name: " . $hrname . "\n";
        $message .= "Company: " . $company . "\n";
        $message .= "Company Email: " . $email . "\n\n";
        $message .= "Message:\n" . $msg . "\n";

        // Headers matching the requested sender and receiver
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $headers .= "From: shivdattvanmane@gmail.com\r\n";
        $headers .= "Reply-To: " . $email . "\r\n"; // Reply directly to HR
        $headers .= "X-Mailer: PHP/" . phpversion();

        $mailSent = @mail($to, $subject, $message, $headers);

        if ($mailSent) {
            echo "HR Inquiry submitted successfully and email notification sent!";
        } else {
            echo "HR Inquiry saved to local server database (email delivery requires configured SMTP server).";
        }

    } else {
        http_response_code(400);
        echo "Please fill in all required fields.";
    }
} else {
    http_response_code(405);
    echo "Invalid request method.";
}
?>
