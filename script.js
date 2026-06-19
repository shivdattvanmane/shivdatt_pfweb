function sendForm(formId, url, msgId) {
document.getElementById(formId).addEventListener("submit", e => {
e.preventDefault();
fetch(url, { method: "POST", body: new FormData(e.target) })
.then(r => r.text())
.then(d => document.getElementById(msgId).innerText = d);
});
}


sendForm("feedbackForm", "feedback.php", "feedbackMsg");
sendForm("hrForm", "hr_request.php", "hrMsg");