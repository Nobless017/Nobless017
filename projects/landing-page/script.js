// Kopi Sabana: interaksi kecil untuk landing page.
// Halaman tetap bisa dibaca walaupun file ini gagal dimuat.

// ---------- 1. Menu navigasi di HP (tombol garis tiga) ----------
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector("#site-nav");

function setNavOpen(isOpen) {
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    siteNav.classList.toggle("is-open", isOpen);
}

if (navToggle && siteNav) {
    navToggle.addEventListener("click", () => {
        setNavOpen(navToggle.getAttribute("aria-expanded") !== "true");
    });

    // Tutup menu setelah salah satu link diklik
    siteNav.addEventListener("click", (event) => {
        if (event.target.closest("a")) {
            setNavOpen(false);
        }
    });

    // Tutup menu dengan tombol Escape
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
            setNavOpen(false);
            navToggle.focus();
        }
    });
}

// ---------- 2. Garis bawah header muncul saat halaman di-scroll ----------
const header = document.querySelector(".site-header");

function updateHeader() {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
}

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

// ---------- 3. Tab kategori menu (Kopi / Non-kopi / Makanan) ----------
const tabs = Array.from(document.querySelectorAll(".menu-tab"));

function selectTab(selectedTab) {
    tabs.forEach((tab) => {
        const isSelected = tab === selectedTab;
        const panel = document.getElementById(tab.getAttribute("aria-controls"));

        tab.setAttribute("aria-selected", String(isSelected));
        tab.tabIndex = isSelected ? 0 : -1;
        panel.hidden = !isSelected;
    });
}

tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(tab));

    // Pengguna keyboard bisa pindah tab dengan panah kiri/kanan, Home, dan End
    tab.addEventListener("keydown", (event) => {
        const keyToIndex = {
            ArrowRight: (index + 1) % tabs.length,
            ArrowLeft: (index - 1 + tabs.length) % tabs.length,
            Home: 0,
            End: tabs.length - 1
        };

        if (!(event.key in keyToIndex)) {
            return;
        }

        event.preventDefault();
        const nextTab = tabs[keyToIndex[event.key]];
        nextTab.focus();
        selectTab(nextTab);
    });
});

if (tabs.length > 0) {
    selectTab(tabs.find((tab) => tab.getAttribute("aria-selected") === "true") || tabs[0]);
}

// ---------- 4. Status "Open now / Closed" sesuai jam di Kupang ----------
// Kupang memakai WITA (UTC+8), jadi waktunya dihitung dari UTC,
// supaya hasilnya benar walaupun pengunjung membuka dari zona waktu lain.
const openStatus = document.querySelector(".open-status");
const hourRows = Array.from(document.querySelectorAll(".hours [data-days]"));

function toMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number); // "07:00" -> 7 jam, 0 menit
    return hours * 60 + minutes;
}

function findRowForDay(day) {
    return hourRows.find((row) => row.dataset.days.split(",").map(Number).includes(day));
}

function updateOpenStatus() {
    const now = new Date();
    const kupangTime = new Date(now.getTime() + (now.getTimezoneOffset() + 8 * 60) * 60000);
    const today = kupangTime.getDay(); // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
    const minutesNow = kupangTime.getHours() * 60 + kupangTime.getMinutes();
    const todayRow = findRowForDay(today);

    hourRows.forEach((row) => row.classList.toggle("is-today", row === todayRow));

    if (!openStatus || !todayRow) {
        return;
    }

    const { open, close } = todayRow.dataset;

    if (minutesNow >= toMinutes(open) && minutesNow < toMinutes(close)) {
        openStatus.dataset.state = "open";
        openStatus.textContent = `Open now · closes at ${close} WITA`;
    } else if (minutesNow < toMinutes(open)) {
        openStatus.dataset.state = "closed";
        openStatus.textContent = `Closed · opens at ${open} WITA`;
    } else {
        const tomorrowRow = findRowForDay((today + 1) % 7);
        openStatus.dataset.state = "closed";
        openStatus.textContent = `Closed · opens tomorrow at ${tomorrowRow.dataset.open} WITA`;
    }
}

updateOpenStatus();
setInterval(updateOpenStatus, 60 * 1000); // cek ulang tiap menit
