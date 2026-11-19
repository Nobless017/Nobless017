// Catatan Keuangan: aplikasi pencatat pemasukan & pengeluaran.
// Semua data disimpan di localStorage browser, jadi tidak butuh server.

// ---------- 1. Daftar kategori ----------
const CATEGORIES = {
    expense: [
        { id: "makan", label: "Makan & Minum", icon: "🍜", color: "#f97316" },
        { id: "transport", label: "Transportasi", icon: "🛵", color: "#0ea5e9" },
        { id: "kos", label: "Kos & Tagihan", icon: "🏠", color: "#8b5cf6" },
        { id: "kuliah", label: "Kuliah", icon: "📚", color: "#14b8a6" },
        { id: "pulsa", label: "Pulsa & Internet", icon: "📱", color: "#6366f1" },
        { id: "belanja", label: "Belanja", icon: "🛍️", color: "#ec4899" },
        { id: "hiburan", label: "Hiburan", icon: "🎮", color: "#eab308" },
        { id: "lainnya-keluar", label: "Lainnya", icon: "📦", color: "#64748b" }
    ],
    income: [
        { id: "kiriman", label: "Kiriman Orang Tua", icon: "💌", color: "#16a34a" },
        { id: "kerja", label: "Kerja Sampingan", icon: "💼", color: "#0d9488" },
        { id: "beasiswa", label: "Beasiswa", icon: "🎓", color: "#2563eb" },
        { id: "lainnya-masuk", label: "Lainnya", icon: "💰", color: "#65a30d" }
    ]
};

function findCategory(id) {
    const all = [...CATEGORIES.expense, ...CATEGORIES.income];
    return all.find((category) => category.id === id) || { label: "Lainnya", icon: "📦", color: "#64748b" };
}

// ---------- 2. Simpan & baca data dari localStorage ----------
const STORAGE_KEY = "catatan-keuangan:v1";

function isValidTransaction(item) {
    return item
        && (item.type === "income" || item.type === "expense")
        && typeof item.amount === "number"
        && typeof item.date === "string";
}

function loadTransactions() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(saved) ? saved.filter(isValidTransaction) : [];
    } catch (error) {
        console.warn("Data tidak bisa dibaca dari localStorage.", error);
        return [];
    }
}

function saveTransactions() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (error) {
        console.warn("Data tidak bisa disimpan ke localStorage.", error);
    }
}

let transactions = loadTransactions();

// ---------- 3. Fungsi bantu: uang & tanggal ----------
const rupiahFormat = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
});

function formatRupiah(amount) {
    return rupiahFormat.format(amount);
}

// Tanggal disimpan sebagai teks "2026-11-19" supaya mudah dibandingkan
function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function parseDateKey(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function daysAgo(count) {
    const date = new Date();
    date.setDate(date.getDate() - count);
    return toDateKey(date);
}

function formatDayLabel(key) {
    if (key === daysAgo(0)) return "Hari ini";
    if (key === daysAgo(1)) return "Kemarin";
    return parseDateKey(key).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
}

function createId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Membuat elemen HTML. Teks dimasukkan lewat textContent supaya aman dari kode jahat.
function createEl(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function createCategoryIcon(category) {
    const icon = createEl("span", "category-icon", category.icon);
    icon.style.background = `${category.color}22`; // warna kategori dengan transparansi
    icon.setAttribute("aria-hidden", "true");
    return icon;
}

// ---------- 4. Elemen di halaman ----------
const $ = (selector) => document.querySelector(selector);

const monthLabel = $("#month-label");
const prevMonthButton = $("#prev-month");
const nextMonthButton = $("#next-month");
const summaryCard = $("#summary-card");
const balanceEl = $("#balance");
const incomeEl = $("#total-income");
const expenseEl = $("#total-expense");
const meterFill = $("#spend-meter");
const hintEl = $("#spend-hint");
const categoryList = $("#category-list");
const categoryEmpty = $("#category-empty");
const transactionList = $("#transaction-list");
const filterEmpty = $("#filter-empty");
const emptyState = $("#empty-state");
const sampleButton = $("#load-sample");
const filterButtons = document.querySelectorAll(".chip");
const dialog = $("#transaction-dialog");
const form = $("#transaction-form");
const amountInput = $("#amount");
const categorySelect = $("#category");
const noteInput = $("#note");
const dateInput = $("#date");
const formError = $("#form-error");
const toast = $("#toast");
const toastMessage = $("#toast-message");
const toastUndo = $("#toast-undo");

const TRASH_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4h6v3"/></svg>';

// ---------- 5. Bulan yang sedang dilihat & filter ----------
const today = new Date();
let viewYear = today.getFullYear();
let viewMonth = today.getMonth(); // 0 = Januari, 11 = Desember
let activeFilter = "all";

function viewMonthKey() {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
}

function isCurrentMonth() {
    return viewYear === today.getFullYear() && viewMonth === today.getMonth();
}

function changeMonth(step) {
    const date = new Date(viewYear, viewMonth + step, 1);
    viewYear = date.getFullYear();
    viewMonth = date.getMonth();
    render();
}

// ---------- 6. Menampilkan data ke layar ----------
function sumByType(items, type) {
    return items
        .filter((item) => item.type === type)
        .reduce((total, item) => total + item.amount, 0);
}

function render() {
    const monthItems = transactions.filter((item) => item.date.startsWith(viewMonthKey()));

    monthLabel.textContent = new Date(viewYear, viewMonth, 1)
        .toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    nextMonthButton.disabled = isCurrentMonth();

    renderSummary(monthItems);
    renderCategories(monthItems);
    renderHistory(monthItems);
}

function renderSummary(items) {
    const income = sumByType(items, "income");
    const expense = sumByType(items, "expense");
    const percentUsed = income > 0 ? Math.round((expense / income) * 100) : 0;

    balanceEl.textContent = formatRupiah(income - expense);
    incomeEl.textContent = formatRupiah(income);
    expenseEl.textContent = formatRupiah(expense);
    meterFill.style.width = `${income > 0 ? Math.min(percentUsed, 100) : (expense > 0 ? 100 : 0)}%`;

    if (items.length === 0) {
        summaryCard.dataset.state = "ok";
        hintEl.textContent = "Belum ada transaksi di bulan ini.";
    } else if (income === 0) {
        summaryCard.dataset.state = "over";
        hintEl.textContent = "Belum ada pemasukan yang dicatat bulan ini.";
    } else if (expense > income) {
        summaryCard.dataset.state = "over";
        hintEl.textContent = `Pengeluaran melebihi pemasukan sebesar ${formatRupiah(expense - income)}.`;
    } else {
        summaryCard.dataset.state = percentUsed >= 80 ? "warning" : "ok";
        hintEl.textContent = `Kamu sudah memakai ${percentUsed}% dari pemasukan bulan ini.`;
    }
}

function renderCategories(items) {
    const expenses = items.filter((item) => item.type === "expense");
    const total = sumByType(expenses, "expense");

    // Jumlahkan pengeluaran per kategori, lalu urutkan dari yang terbesar
    const totals = new Map();
    expenses.forEach((item) => {
        totals.set(item.category, (totals.get(item.category) || 0) + item.amount);
    });
    const rows = [...totals.entries()].sort((a, b) => b[1] - a[1]);

    categoryList.replaceChildren(...rows.map(([categoryId, amount]) => {
        const category = findCategory(categoryId);
        const percent = Math.round((amount / total) * 100);

        const top = createEl("div", "category-top");
        top.append(
            createEl("span", "category-name", category.label),
            createEl("span", "category-amount", formatRupiah(amount))
        );

        const fill = createEl("span");
        fill.style.width = `${percent}%`;
        fill.style.background = category.color;
        const bar = createEl("div", "category-bar");
        bar.append(fill);

        const info = createEl("div");
        info.append(top, bar);

        const row = createEl("li", "category-row");
        row.append(createCategoryIcon(category), info, createEl("span", "category-percent", `${percent}%`));
        return row;
    }));

    categoryEmpty.hidden = rows.length > 0;
}

function createTransactionItem(item) {
    const category = findCategory(item.category);

    const info = createEl("div", "transaction-info");
    info.append(createEl("span", "transaction-title", category.label));
    if (item.note) {
        info.append(createEl("span", "transaction-note", item.note));
    }

    const sign = item.type === "income" ? "+" : "−";
    const amount = createEl("span", `transaction-amount ${item.type}`, sign + formatRupiah(item.amount));

    const deleteButton = createEl("button", "delete-button");
    deleteButton.type = "button";
    deleteButton.innerHTML = TRASH_ICON; // ikon tetap, bukan input pengguna
    deleteButton.setAttribute("aria-label", `Hapus ${category.label} ${formatRupiah(item.amount)}`);
    deleteButton.addEventListener("click", () => deleteTransaction(item.id));

    const row = createEl("li", "transaction");
    row.append(createCategoryIcon(category), info, amount, deleteButton);
    return row;
}

function renderHistory(items) {
    const visible = items
        .filter((item) => activeFilter === "all" || item.type === activeFilter)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

    // Kelompokkan transaksi berdasarkan tanggal
    const groups = new Map();
    visible.forEach((item) => {
        if (!groups.has(item.date)) groups.set(item.date, []);
        groups.get(item.date).push(item);
    });

    transactionList.replaceChildren(...[...groups.entries()].map(([date, dayItems]) => {
        const itemList = createEl("ul", "transaction-items");
        dayItems.forEach((item) => itemList.append(createTransactionItem(item)));

        const group = createEl("section", "day-group");
        group.append(createEl("h3", "day-label", formatDayLabel(date)), itemList);
        return group;
    }));

    emptyState.hidden = items.length > 0;
    sampleButton.hidden = transactions.length > 0; // data contoh hanya ditawarkan kalau aplikasi masih kosong
    filterEmpty.hidden = items.length === 0 || visible.length > 0;
}

// ---------- 7. Hapus transaksi + tombol "Batalkan" ----------
let lastDeleted = null;
let toastTimer = 0;

function showToast(message, withUndo = false) {
    toastMessage.textContent = message;
    toastUndo.hidden = !withUndo;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.hidden = true;
        lastDeleted = null;
    }, 5000);
}

function deleteTransaction(id) {
    const index = transactions.findIndex((item) => item.id === id);
    if (index === -1) return;

    lastDeleted = { item: transactions[index], index };
    transactions.splice(index, 1);
    saveTransactions();
    render();
    showToast("Transaksi dihapus.", true);
}

toastUndo.addEventListener("click", () => {
    if (!lastDeleted) return;
    transactions.splice(lastDeleted.index, 0, lastDeleted.item);
    lastDeleted = null;
    saveTransactions();
    render();
    showToast("Transaksi dikembalikan.");
});

// ---------- 8. Form tambah transaksi ----------
function fillCategoryOptions(type) {
    categorySelect.replaceChildren(...CATEGORIES[type].map((category) => {
        const option = createEl("option", "", `${category.icon}  ${category.label}`);
        option.value = category.id;
        return option;
    }));
    form.dataset.type = type;
}

function openForm() {
    form.reset();
    formError.textContent = "";
    fillCategoryOptions("expense");
    // Kalau sedang melihat bulan lalu, tanggal default = hari terakhir bulan itu
    dateInput.value = isCurrentMonth() ? daysAgo(0) : toDateKey(new Date(viewYear, viewMonth + 1, 0));
    dateInput.max = daysAgo(0); // tidak bisa mencatat tanggal di masa depan
    dialog.showModal();
    amountInput.focus();
}

form.elements.type.forEach((radio) => {
    radio.addEventListener("change", () => fillCategoryOptions(radio.value));
});

// Format angka saat diketik: 25000 -> 25.000
amountInput.addEventListener("input", () => {
    const digits = amountInput.value.replace(/\D/g, "").slice(0, 12);
    amountInput.value = digits ? Number(digits).toLocaleString("id-ID") : "";
});

form.addEventListener("submit", (event) => {
    event.preventDefault();

    const amount = Number(amountInput.value.replace(/\D/g, ""));
    if (!amount) {
        formError.textContent = "Masukkan jumlah uang yang lebih dari 0.";
        amountInput.focus();
        return;
    }

    const type = form.elements.type.value;
    transactions.push({
        id: createId(),
        type,
        amount,
        category: categorySelect.value,
        note: noteInput.value.trim(),
        date: dateInput.value,
        createdAt: Date.now()
    });
    saveTransactions();

    // Pindah ke bulan transaksi yang baru dicatat supaya langsung terlihat
    const savedDate = parseDateKey(dateInput.value);
    viewYear = savedDate.getFullYear();
    viewMonth = savedDate.getMonth();

    dialog.close();
    render();
    showToast(type === "income" ? "Pemasukan tersimpan." : "Pengeluaran tersimpan.");
});

$("#open-form").addEventListener("click", openForm);
$("#cancel-form").addEventListener("click", () => dialog.close());

// Klik area gelap di luar form untuk menutup
dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
});

// ---------- 9. Tombol lain ----------
prevMonthButton.addEventListener("click", () => changeMonth(-1));
nextMonthButton.addEventListener("click", () => changeMonth(1));

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;
        filterButtons.forEach((other) => other.setAttribute("aria-pressed", String(other === button)));
        render();
    });
});

$("#reset-data").addEventListener("click", () => {
    if (transactions.length === 0) {
        showToast("Belum ada data untuk dihapus.");
        return;
    }
    if (!confirm("Hapus semua transaksi? Data yang sudah dihapus tidak bisa dikembalikan.")) return;

    transactions = [];
    saveTransactions();
    render();
    showToast("Semua data dihapus.");
});

// ---------- 10. Data contoh ----------
// [berapa hari lalu, jenis, kategori, jumlah, catatan]
const SAMPLE_DATA = [
    [0, "expense", "makan", 18000, "Makan siang di kantin"],
    [0, "expense", "transport", 10000, "Ojek ke kampus"],
    [1, "expense", "pulsa", 55000, "Paket data bulanan"],
    [2, "expense", "makan", 25000, "Kopi sambil nugas"],
    [3, "expense", "kuliah", 32000, "Print & jilid laporan"],
    [4, "income", "kerja", 300000, "Desain poster acara himpunan"],
    [5, "expense", "makan", 45000, "Belanja bahan masak"],
    [6, "expense", "hiburan", 40000, "Nonton bareng teman"],
    [8, "expense", "transport", 20000, "Bensin motor"],
    [10, "expense", "belanja", 85000, "Sandal dan kaos"],
    [12, "expense", "makan", 22000, "Makan malam"],
    [14, "expense", "kos", 650000, "Bayar kos"],
    [15, "income", "kiriman", 1500000, "Kiriman bulanan"],
    [20, "expense", "makan", 30000, "Makan bareng teman kelas"],
    [25, "expense", "transport", 15000, "Ojek"],
    [33, "expense", "kos", 650000, "Bayar kos"],
    [34, "income", "kiriman", 1500000, "Kiriman bulanan"],
    [38, "expense", "pulsa", 55000, "Paket data"]
];

function loadSampleData() {
    const now = Date.now();
    transactions = SAMPLE_DATA.map(([ago, type, category, amount, note], index) => ({
        id: createId(),
        type,
        category,
        amount,
        note,
        date: daysAgo(ago),
        createdAt: now - index
    }));
    saveTransactions();
    render();
}

sampleButton.addEventListener("click", loadSampleData);

// ---------- 11. Mulai ----------
// Link dengan "?contoh" (dipakai di portfolio) langsung mengisi data contoh
// kalau aplikasi masih kosong.
if (transactions.length === 0 && new URLSearchParams(window.location.search).has("contoh")) {
    loadSampleData();
} else {
    render();
}
