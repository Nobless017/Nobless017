const root = document.documentElement;
const themeToggle = document.querySelector(".theme-toggle");
const themeKey = "theme";
const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function getPreferredTheme() {
    try {
        const savedTheme = localStorage.getItem(themeKey);
        if (savedTheme === "light" || savedTheme === "dark") {
            return savedTheme;
        }
    } catch (error) {
        console.warn("Preferensi tema tidak dapat dibaca dari penyimpanan lokal.", error);
    }

    return colorScheme.matches ? "dark" : "light";
}

function applyTheme(theme) {
    const isDark = theme === "dark";
    root.dataset.theme = isDark ? "dark" : "light";

    if (themeToggle) {
        themeToggle.textContent = isDark ? "☀️" : "🌙";
        themeToggle.setAttribute("aria-label", isDark ? "Ubah tema terang" : "Ubah tema gelap");
        themeToggle.setAttribute("aria-pressed", String(isDark));
        themeToggle.title = isDark ? "Gunakan tema terang" : "Gunakan tema gelap";
    }
}

function saveTheme(theme) {
    try {
        localStorage.setItem(themeKey, theme);
    } catch (error) {
        console.warn("Preferensi tema tidak dapat disimpan.", error);
    }
}

applyTheme(getPreferredTheme());

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
        applyTheme(nextTheme);
        saveTheme(nextTheme);
    });
}

window.addEventListener("storage", (event) => {
    if (event.key === themeKey) {
        applyTheme(event.newValue === "light" || event.newValue === "dark"
            ? event.newValue
            : (colorScheme.matches ? "dark" : "light"));
    }
});

function addScrollReveals() {
    if (reducedMotion || !("IntersectionObserver" in window)) {
        return;
    }

    const revealTargets = document.querySelectorAll(
        ".projects .section-heading, .project-card, .timeline-item, .info-grid, .footer"
    );
    if (revealTargets.length === 0) {
        return;
    }

    const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                currentObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: "0px 0px -32px 0px"
    });

    revealTargets.forEach((element, index) => {
        element.classList.add("reveal-on-scroll");
        element.style.setProperty("--reveal-delay", `${Math.min(index % 3, 2) * 90}ms`);
        observer.observe(element);
    });
}

addScrollReveals();

const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

function getFrameDelta(timestamp, previousTimestamp) {
    return Math.min(previousTimestamp ? timestamp - previousTimestamp : 1000 / 60, 50) / 1000;
}

function springTo(motion, target, delta) {
    const stiffness = 210;
    const damping = 29;
    const acceleration = (target - motion.value) * stiffness;

    motion.velocity += acceleration * delta;
    motion.velocity *= Math.exp(-damping * delta);
    motion.value += motion.velocity * delta;

    if (Math.abs(target - motion.value) < 0.01 && Math.abs(motion.velocity) < 0.02) {
        motion.value = target;
        motion.velocity = 0;
    }

    return motion.velocity !== 0 || motion.value !== target;
}

function addPointerEffects() {
    if (!finePointer || reducedMotion) {
        return;
    }

    const glow = document.createElement("div");
    glow.className = "cursor-glow";
    glow.setAttribute("aria-hidden", "true");
    document.body.appendChild(glow);

    let glowFrame = 0;
    let glowTargetX = window.innerWidth / 2;
    let glowTargetY = window.innerHeight / 2;
    const glowX = { value: glowTargetX, velocity: 0 };
    const glowY = { value: glowTargetY, velocity: 0 };
    let glowPreviousFrame = 0;

    function animateGlow(timestamp) {
        const delta = getFrameDelta(timestamp, glowPreviousFrame);
        glowPreviousFrame = timestamp;
        const movingX = springTo(glowX, glowTargetX, delta);
        const movingY = springTo(glowY, glowTargetY, delta);
        glow.style.setProperty("--cursor-x", `${glowX.value}px`);
        glow.style.setProperty("--cursor-y", `${glowY.value}px`);

        if (movingX || movingY) {
            glowFrame = requestAnimationFrame(animateGlow);
        } else {
            glowFrame = 0;
            glowPreviousFrame = 0;
        }
    }

    window.addEventListener("pointermove", (event) => {
        if (event.pointerType && event.pointerType !== "mouse") {
            return;
        }

        glowTargetX = event.clientX;
        glowTargetY = event.clientY;
        glow.classList.add("is-visible");
        if (!glowFrame) {
            glowFrame = requestAnimationFrame(animateGlow);
        }
    }, { passive: true });

    document.addEventListener("pointerleave", () => {
        glow.classList.remove("is-visible");
    });

    const tiltTargets = document.querySelectorAll(".project-card, .hero-card");
    tiltTargets.forEach((card) => {
        let tiltFrame = 0;
        const tiltX = { value: 0, velocity: 0 };
        const tiltY = { value: 0, velocity: 0 };
        const liftX = { value: 0, velocity: 0 };
        const liftY = { value: 0, velocity: 0 };
        let targetTiltX = 0;
        let targetTiltY = 0;
        let targetLiftX = 0;
        let targetLiftY = 0;
        let previousFrame = 0;

        function animateTilt(timestamp) {
            const delta = getFrameDelta(timestamp, previousFrame);
            previousFrame = timestamp;
            const movingTiltX = springTo(tiltX, targetTiltX, delta);
            const movingTiltY = springTo(tiltY, targetTiltY, delta);
            const movingLiftX = springTo(liftX, targetLiftX, delta);
            const movingLiftY = springTo(liftY, targetLiftY, delta);

            card.style.setProperty("--tilt-x", `${tiltX.value.toFixed(3)}deg`);
            card.style.setProperty("--tilt-y", `${tiltY.value.toFixed(3)}deg`);
            card.style.setProperty("--lift-x", `${liftX.value.toFixed(3)}px`);
            card.style.setProperty("--lift-y", `${liftY.value.toFixed(3)}px`);

            const stillMoving = movingTiltX || movingTiltY || movingLiftX || movingLiftY;

            if (stillMoving) {
                tiltFrame = requestAnimationFrame(animateTilt);
            } else {
                tiltFrame = 0;
                previousFrame = 0;
            }
        }

        card.addEventListener("pointermove", (event) => {
            const bounds = card.getBoundingClientRect();
            const x = (event.clientX - bounds.left) / bounds.width - 0.5;
            const y = (event.clientY - bounds.top) / bounds.height - 0.5;

            targetTiltX = -y * 5;
            targetTiltY = x * 7;
            targetLiftX = x * 4;
            targetLiftY = y * 4;
            card.classList.add("has-pointer");
            if (!tiltFrame) {
                tiltFrame = requestAnimationFrame(animateTilt);
            }
        });

        card.addEventListener("pointerleave", () => {
            card.classList.remove("has-pointer");
            targetTiltX = 0;
            targetTiltY = 0;
            targetLiftX = 0;
            targetLiftY = 0;
            if (!tiltFrame) {
                tiltFrame = requestAnimationFrame(animateTilt);
            }
        });
    });

    const magneticTargets = document.querySelectorAll(".button-link, .theme-toggle, .project-actions a");
    magneticTargets.forEach((target) => {
        let magneticFrame = 0;
        const magnetX = { value: 0, velocity: 0 };
        const magnetY = { value: 0, velocity: 0 };
        let targetMagnetX = 0;
        let targetMagnetY = 0;
        let previousFrame = 0;

        function animateMagnet(timestamp) {
            const delta = getFrameDelta(timestamp, previousFrame);
            previousFrame = timestamp;
            const movingX = springTo(magnetX, targetMagnetX, delta);
            const movingY = springTo(magnetY, targetMagnetY, delta);
            target.style.setProperty("--magnet-x", `${magnetX.value.toFixed(3)}px`);
            target.style.setProperty("--magnet-y", `${magnetY.value.toFixed(3)}px`);

            if (movingX || movingY) {
                magneticFrame = requestAnimationFrame(animateMagnet);
            } else {
                magneticFrame = 0;
                previousFrame = 0;
            }
        }

        target.addEventListener("pointermove", (event) => {
            const bounds = target.getBoundingClientRect();
            const x = event.clientX - bounds.left - bounds.width / 2;
            const y = event.clientY - bounds.top - bounds.height / 2;

            target.style.setProperty("--pointer-x", `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
            target.style.setProperty("--pointer-y", `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
            targetMagnetX = x * 0.12;
            targetMagnetY = y * 0.12;
            target.classList.add("is-magnetic");
            if (!magneticFrame) {
                magneticFrame = requestAnimationFrame(animateMagnet);
            }
        });

        target.addEventListener("pointerleave", () => {
            target.classList.remove("is-magnetic");
            target.style.setProperty("--pointer-x", "50%");
            target.style.setProperty("--pointer-y", "50%");
            targetMagnetX = 0;
            targetMagnetY = 0;
            if (!magneticFrame) {
                magneticFrame = requestAnimationFrame(animateMagnet);
            }
        });
    });
}

function addActiveNavMotion() {
    const navLinks = document.querySelector(".nav-links");
    const activeLink = navLinks && navLinks.querySelector(".active");
    if (!navLinks || !activeLink) {
        return;
    }

    navLinks.style.setProperty("--active-width", `${activeLink.offsetWidth}px`);
    navLinks.style.setProperty("--active-x", `${activeLink.offsetLeft}px`);

    navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("mouseenter", () => {
            navLinks.style.setProperty("--active-width", `${link.offsetWidth}px`);
            navLinks.style.setProperty("--active-x", `${link.offsetLeft}px`);
            navLinks.classList.add("is-previewing");
        });

        link.addEventListener("mouseleave", () => {
            navLinks.style.setProperty("--active-width", `${activeLink.offsetWidth}px`);
            navLinks.style.setProperty("--active-x", `${activeLink.offsetLeft}px`);
            navLinks.classList.remove("is-previewing");
        });
    });
}

if (themeToggle && !reducedMotion) {
    themeToggle.addEventListener("click", () => {
        themeToggle.animate(
            [
                { transform: "rotate(0deg) scale(1)" },
                { transform: "rotate(180deg) scale(0.88)" },
                { transform: "rotate(360deg) scale(1)" }
            ],
            { duration: 420, easing: "cubic-bezier(.22,1,.36,1)" }
        );
    });
}

addPointerEffects();
addActiveNavMotion();

const contactForm = document.querySelector(".contact-form");
if (contactForm) {
    const status = contactForm.querySelector(".form-status");
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const defaultButtonLabel = submitButton.textContent;

    function showFormStatus(message, state) {
        status.textContent = message;
        status.dataset.state = state;
        status.classList.add("is-visible");
    }

    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!contactForm.reportValidity()) {
            return;
        }

        const formData = new FormData(contactForm);

        submitButton.disabled = true;
        submitButton.textContent = "Mengirim...";
        contactForm.setAttribute("aria-busy", "true");
        status.classList.remove("is-visible");

        try {
            const response = await fetch(contactForm.action, {
                method: contactForm.method.toUpperCase(),
                headers: {
                    Accept: "application/json"
                },
                body: formData
            });
            const contentType = response.headers.get("content-type") || "";
            const result = contentType.includes("application/json")
                ? await response.json()
                : null;

            if (!response.ok) {
                const errors = result && Array.isArray(result.errors)
                    ? result.errors
                        .map((item) => item && typeof item.message === "string" ? item.message : "")
                        .filter(Boolean)
                        .join(" ")
                    : "";
                showFormStatus(errors || "Pesan gagal dikirim. Coba lagi beberapa saat lagi.", "error");
                return;
            }

            if (!result) {
                throw new Error("Formspree mengembalikan respons yang tidak dikenali.");
            }

            showFormStatus("Pesan berhasil dikirim. Terima kasih sudah menghubungi saya!", "success");
            contactForm.reset();
        } catch (error) {
            console.error("Pengiriman formulir ke Formspree gagal.", error);
            showFormStatus("Pesan belum terkirim. Periksa koneksi internet lalu coba lagi.", "error");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = defaultButtonLabel;
            contactForm.removeAttribute("aria-busy");
        }
    });
}
