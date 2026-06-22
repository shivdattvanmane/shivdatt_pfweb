const cursor = document.getElementById("cursor");
const loaderBar = document.getElementById("loader-bar");
const heroContent = document.getElementById("hero-content");
const menuToggle = document.querySelector(".menu-toggle");

if (cursor) {
    document.addEventListener("mousemove", (event) => {
        cursor.style.left = `${event.clientX}px`;
        cursor.style.top = `${event.clientY}px`;
    });

    document.querySelectorAll("a, button, input, textarea, select").forEach((element) => {
        element.addEventListener("mouseenter", () => cursor.classList.add("active"));
        element.addEventListener("mouseleave", () => cursor.classList.remove("active"));
    });
}

window.addEventListener("load", () => {
    if (!loaderBar) {
        return;
    }

    loaderBar.style.width = "100%";
    window.setTimeout(() => {
        const loader = loaderBar.parentElement;
        if (loader) {
            loader.style.opacity = "0";
            loader.style.pointerEvents = "none";
        }
    }, 800);
});

if (heroContent) {
    document.addEventListener("mousemove", (event) => {
        if (window.matchMedia("(max-width: 760px)").matches) {
            heroContent.style.transform = "";
            return;
        }

        const xAxis = (window.innerWidth / 2 - event.pageX) / 60;
        const yAxis = (window.innerHeight / 2 - event.pageY) / 60;
        heroContent.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
    });
}

if (menuToggle) {
    menuToggle.addEventListener("click", () => {
        const isOpen = document.body.classList.toggle("menu-open");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
        const target = document.querySelector(anchor.getAttribute("href"));
        if (!target) {
            return;
        }

        event.preventDefault();
        document.body.classList.remove("menu-open");
        if (menuToggle) {
            menuToggle.setAttribute("aria-expanded", "false");
        }
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
});

function sendForm(formId, url, msgId) {
    const form = document.getElementById(formId);
    const message = document.getElementById(msgId);

    if (!form || !message) {
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        message.textContent = "Sending...";
        message.className = "status-msg";

        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data),
            });
            const resultText = await response.text();
            if (response.ok) {
                message.textContent = resultText;
                form.reset();
            } else {
                throw new Error(resultText || "Server error");
            }
        } catch (error) {
            message.textContent = error.message || "Unable to submit right now. Please try again later.";
        }
    });
}

sendForm("feedbackForm", "/api/feedback", "feedbackMsg");
sendForm("hrForm", "/api/hr_request", "hrMsg");
