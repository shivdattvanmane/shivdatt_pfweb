<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = isset($_POST['name']) ? strip_tags(trim($_POST['name'])) : '';
    $city = isset($_POST['city']) ? strip_tags(trim($_POST['city'])) : '';
    $feedback = isset($_POST['feedback']) ? strip_tags(trim($_POST['feedback'])) : '';

    if (!empty($name) && !empty($feedback)) {
        
        // 1. Save to Local SQLite Database (strictly on the server)
        try {
            $db = new SQLite3('portfolio.db');
            
            // Create table if not exists
            $db->exec("CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                city TEXT NOT NULL,
                feedback TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )");

            // Insert using prepared statement for security
            $stmt = $db->prepare("INSERT INTO feedback (name, city, feedback) VALUES (:name, :city, :feedback)");
            $stmt->bindValue(':name', $name, SQLITE3_TEXT);
            $stmt->bindValue(':city', $city, SQLITE3_TEXT);
            $stmt->bindValue(':feedback', $feedback, SQLITE3_TEXT);
            $stmt->execute();
            $db->close();
        } catch (Exception $e) {
            // Silently handle DB errors to avoid leaking paths to client
            error_log("SQLite database error: " . $e->getMessage());
        }

        // 2. Send Email Notification
        $to = "shivdattvanmane@gmail.com";
        $subject = "New Portfolio Feedback from " . $name;
        
        $message = "You have received new feedback on your portfolio website:\n\n";
        $message .= "Name: " . $name . "\n";
        $message .= "City: " . $city . "\n";
        $message .= "Feedback:\n" . $feedback . "\n";

        // Headers matching the requested sender and receiver
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $headers .= "From: shivdattvanmane@gmail.com\r\n";
        $headers .= "Reply-To: shivdattvanmane@gmail.com\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion();

        $mailSent = @mail($to, $subject, $message, $headers);

        if ($mailSent) {
            echo "Feedback submitted successfully and email notification sent!";
        } else {
            echo "Feedback saved to local server database (email delivery requires configured SMTP server).";
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
