// --- inisialisasi koneksi supabase ---
const SUPABASE_URL = 'https://etiwybfhsmcwccfavgri.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0aXd5YmZoc21jd2NjZmF2Z3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDg3NDAsImV4cCI6MjA4NTcyNDc0MH0.Wm0Sbx-N7ZNg_pGoPyBmWi7XEqEzpHvXvOrQE2FJmWs';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- status aplikasi (state management) ---
let activeTab = 'home';
let advancedFilter = {
    kategori: '', 
    lokasi: '',
    dateFrom: '',
    dateTo: '',
    sort: 'newest'
};

// --- referensi elemen html utama ---
const containerBarang = document.getElementById('container-barang');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const pageTitle = document.getElementById('pageTitle');

// --- fungsi toggle tampilan pencarian ---
function toggleSearch() {
    const searchBox = document.getElementById('searchContainer');
    const input = document.getElementById('searchInput');
    if (searchBox.style.display === 'none') {
        searchBox.style.display = 'block';
        setTimeout(() => input.focus(), 100);
    } else {
        searchBox.style.display = 'none';
    }
}

// --- fungsi pencarian realtime ---
function cariBarang() {
    ambilData();
}

// --- manajemen modal filter ---
function bukaModalFilter() {
    const myModal = new bootstrap.Modal(document.getElementById('modalFilter'));
    myModal.show();
}

function terapkanFilter(e) {
    e.preventDefault();
    // ambil nilai dari form filter
    advancedFilter.kategori = document.getElementById('filterKategoriSelect').value;
    advancedFilter.lokasi = document.getElementById('filterLokasi').value;
    advancedFilter.dateFrom = document.getElementById('filterDateFrom').value;
    advancedFilter.dateTo = document.getElementById('filterDateTo').value;
    advancedFilter.sort = document.getElementById('filterSort').value;

    document.getElementById('activeFilterBadge').classList.remove('d-none');
    
    // tutup modal setelah filter diterapkan
    const modalEl = document.getElementById('modalFilter');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();

    ambilData();
}

function resetFilter() {
    document.getElementById('formFilter').reset();
    advancedFilter = { kategori: '', lokasi: '', dateFrom: '', dateTo: '', sort: 'newest' };
    document.getElementById('activeFilterBadge').classList.add('d-none');
    
    // tutup modal jika sedang terbuka
    const modalEl = document.getElementById('modalFilter');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if(modal) modal.hide();

    ambilData();
}

// --- manajemen halaman info (credits) ---
function bukaCredits() {
    document.getElementById('credits-view').classList.add('active');
}

function tutupCredits() {
    document.getElementById('credits-view').classList.remove('active');
}

// --- navigasi tab bawah ---
function switchTab(tabName, btnElement) {
    activeTab = tabName;
    resetFilter(); // reset filter agar hasil bersih saat pindah tab

    // update tampilan tombol aktif
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    btnElement.classList.add('active');

    // update judul halaman
    if (tabName === 'home') {
        pageTitle.innerText = "FOUNDIT-SMKN64";
        document.getElementById('searchContainer').style.display = 'none';
    } else if (tabName === 'temuan') {
        pageTitle.innerText = "Barang Temuan";
    } else if (tabName === 'hilang') {
        pageTitle.innerText = "Info Kehilangan";
    }

    ambilData();
}

// --- logika pengambilan data (core) ---
async function ambilData() {
    const keyword = document.getElementById('searchInput').value;
    
    // kosongkan container untuk mencegah duplikasi data
    containerBarang.innerHTML = ''; 
    loadingState.style.display = 'block';
    emptyState.classList.add('d-none');

    // query dasar
    let query = db.from('items').select('*').eq('status', 'Tersedia');

    // filter berdasarkan tab aktif
    if (activeTab === 'temuan') query = query.eq('tipe', 'TEMUAN');
    else if (activeTab === 'hilang') query = query.eq('tipe', 'KEHILANGAN');

    // filter pencarian kata kunci
    if (keyword) query = query.ilike('nama_barang', `%${keyword}%`);
    
    // filter lanjutan (kategori, lokasi, waktu)
    if (advancedFilter.kategori) query = query.eq('kategori', advancedFilter.kategori);
    if (advancedFilter.lokasi) query = query.ilike('lokasi', `%${advancedFilter.lokasi}%`);
    if (advancedFilter.dateFrom) query = query.gte('waktu_ditemukan', advancedFilter.dateFrom);
    if (advancedFilter.dateTo) query = query.lte('waktu_ditemukan', advancedFilter.dateTo);

    // pengurutan data
    if (advancedFilter.sort === 'newest') query = query.order('id', { ascending: false });
    else if (advancedFilter.sort === 'oldest') query = query.order('id', { ascending: true });

    // eksekusi query
    const { data, error } = await query;
    loadingState.style.display = 'none';

    // penanganan error atau data kosong
    if (error || !data || data.length === 0) {
        if(!error) emptyState.classList.remove('d-none');
        return;
    }

    renderKartu(data);
}

// --- fungsi render kartu barang ---
function renderKartu(items) {
    containerBarang.innerHTML = ''; // pastikan bersih lagi

    items.forEach(item => {
        const itemString = encodeURIComponent(JSON.stringify(item));
        const isTemuan = item.tipe === 'TEMUAN';
        const badgeClass = isTemuan ? 'tag-temuan' : 'tag-hilang';
        const badgeText = isTemuan ? 'DITEMUKAN' : 'HILANG';
        let gambar = item.foto_url || 'https://placehold.co/400x400/1e293b/FFF?text=No+Image';

        const kartu = `
            <div class="col-6 col-md-3">
                <div class="card-feed" onclick="bukaDetail('${itemString}')">
                    <div class="feed-img-wrapper">
                        <img src="${gambar}" class="feed-img" loading="lazy">
                        <span class="status-tag ${badgeClass}">${badgeText}</span>
                    </div>
                    <div class="p-3">
                        <h6 class="text-white text-truncate mb-1 fw-bold" style="font-size: 0.9rem;">${item.nama_barang}</h6>
                        <small class="text-muted d-block text-truncate" style="font-size: 0.7rem;">
                            <i class="bi bi-geo-alt-fill me-1"></i>${item.lokasi}
                        </small>
                    </div>
                </div>
            </div>`;
        containerBarang.innerHTML += kartu;
    });
}

// --- manajemen detail barang ---
function bukaDetail(itemJson) {
    const item = JSON.parse(decodeURIComponent(itemJson));
    const isTemuan = item.tipe === 'TEMUAN';

    // isi data ke elemen detail
    document.getElementById('detail-img').src = item.foto_url || 'https://placehold.co/600x600/1e293b/FFF?text=No+Image';
    document.getElementById('detail-judul').innerText = item.nama_barang;
    document.getElementById('detail-deskripsi').innerText = item.deskripsi || "Tidak ada deskripsi.";
    document.getElementById('detail-lokasi').innerText = item.lokasi;
    
    // format tanggal indonesia
    const tgl = new Date(item.waktu_ditemukan).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
    document.getElementById('detail-waktu').innerText = tgl;
    
    const badge = document.getElementById('detail-badge');
    if(isTemuan) {
        badge.className = 'badge rounded-pill bg-success';
        badge.innerText = 'BARANG TEMUAN';
        badge.style.backgroundColor = 'var(--badge-found)';
        document.getElementById('detail-user').innerText = item.nama_penemu;
    } else {
        badge.className = 'badge rounded-pill bg-danger';
        badge.innerText = 'INFO KEHILANGAN';
        badge.style.backgroundColor = 'var(--badge-lost)';
        document.getElementById('detail-user').innerText = item.nama_penemu;
    }

    // setup tombol aksi (wa & selesai)
    const container = document.getElementById('action-buttons');
    const textWA = isTemuan ? 'Hubungi Penemu' : 'Saya Menemukannya!';
    const textSelesai = isTemuan ? 'Barang Sudah Kembali (Hapus)' : 'Barang Sudah Ditemukan (Hapus)';
    
    container.innerHTML = `
        <a href="https://wa.me/${item.whatsapp}" target="_blank" class="btn btn-primary fw-bold py-3 rounded-4">
            <i class="bi bi-whatsapp me-2"></i>${textWA}
        </a>
        <button onclick="tandaiSelesai(${item.id}, '${item.tipe}')" class="btn btn-outline-secondary py-2 rounded-4 text-white border-secondary">
            <i class="bi bi-check-circle me-2"></i>${textSelesai}
        </button>
    `;
    document.getElementById('detail-view').classList.add('active');
}

function tutupDetail() { document.getElementById('detail-view').classList.remove('active'); }

// --- manajemen form laporan ---
function bukaModalLapor() {
    document.getElementById('formLapor').reset();
    cekTipeLaporan(); 
    const myModal = new bootstrap.Modal(document.getElementById('modalLapor'));
    myModal.show();
}

function cekTipeLaporan() {
    const tipe = document.getElementById('inputTipe').value;
    const inputFoto = document.getElementById('inputFoto');
    const label = document.getElementById('labelFoto');
    
    // foto wajib jika barang temuan
    if (tipe === 'TEMUAN') {
        inputFoto.required = true;
        label.innerText = "Wajib foto untuk temuan.";
    } else {
        inputFoto.required = false;
        label.innerText = "Opsional untuk kehilangan.";
    }
}

// --- fungsi tandai selesai (hapus dari list) ---
async function tandaiSelesai(id, tipe) {
    const msg = tipe === 'TEMUAN' ? "Yakin barang sudah kembali?" : "Yakin barang sudah ditemukan?";
    if (!confirm(msg)) return;
    const statusAkhir = tipe === 'TEMUAN' ? 'Sudah Kembali' : 'Sudah Ditemukan';
    const { error } = await db.from('items').update({ status: statusAkhir }).eq('id', id);
    if (error) alert("Gagal update");
    else { tutupDetail(); ambilData(); }
}

// --- submit laporan baru ---
document.getElementById('formLapor').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.querySelector('#formLapor button[type="submit"]');
    const txt = btn.innerText;
    btn.disabled = true; btn.innerText = "Mengirim...";

    try {
        const tipe = document.getElementById('inputTipe').value;
        const file = document.getElementById('inputFoto').files[0];
        let fotoUrl = null;

        // logika upload foto ke storage supabase
        if (file) {
            const fileName = `${Date.now()}_${file.name.replace(/\s/g, '')}`;
            const { error: upErr } = await db.storage.from('barang-foto').upload(fileName, file);
            if (upErr) throw new Error("Gagal Upload Foto");
            const { data } = db.storage.from('barang-foto').getPublicUrl(fileName);
            fotoUrl = data.publicUrl;
        } else if (tipe === 'TEMUAN') {
            throw new Error("Wajib ada foto untuk barang temuan!");
        }

        // format nomor whatsapp agar diawali 62
        let rawWA = document.getElementById('inputWA').value.replace(/\D/g, ''); 
        if (rawWA.startsWith('0')) rawWA = '62' + rawWA.slice(1);
        else if (!rawWA.startsWith('62')) rawWA = '62' + rawWA;

        // gabungkan info kelas ke dalam deskripsi
        const kelas = document.getElementById('inputKelas').value || '-';
        const deskripsiAsli = document.getElementById('inputDeskripsi').value;
        const deskripsiFinal = `${deskripsiAsli}\n\n[Kelas Pelapor: ${kelas}]`;

        // insert data ke tabel items
        const { error } = await db.from('items').insert([{
            tipe: tipe, 
            nama_barang: document.getElementById('inputNama').value,
            kategori: document.getElementById('inputKategori').value,
            lokasi: document.getElementById('inputLokasi').value,
            whatsapp: rawWA,
            waktu_ditemukan: document.getElementById('inputWaktu').value,
            nama_penemu: document.getElementById('inputPenemu').value,
            deskripsi: deskripsiFinal, 
            foto_url: fotoUrl,
            status: 'Tersedia'
        }]);

        if (error) throw error;
        
        // tutup modal dan refresh data
        const modalEl = document.getElementById('modalLapor');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();
        
        alert("Berhasil!");
        document.getElementById('formLapor').reset();
        
        // pindah ke tab yang sesuai
        if(tipe === 'TEMUAN') switchTab('temuan', document.querySelectorAll('.nav-item')[1]);
        else switchTab('hilang', document.querySelectorAll('.nav-item')[3]);

    } catch (err) {
        alert(err.message);
    } finally {
        btn.disabled = false; btn.innerText = txt;
    }
});

// --- fungsi leaderboard (pahlawan sekolah) ---
async function bukaLeaderboard() {
    const modalBody = document.getElementById('leaderboardBody');
    const myModal = new bootstrap.Modal(document.getElementById('modalLeaderboard'));
    myModal.show();
    
    // ambil data barang yang sudah kembali
    const { data } = await db.from('items').select('nama_penemu')
        .eq('status', 'Sudah Kembali').eq('tipe', 'TEMUAN');
        
    if(!data || data.length === 0) {
        modalBody.innerHTML = `<div class="text-center py-4 text-muted">Belum ada data.</div>`;
        return;
    }

    // hitung jumlah kontribusi per orang
    const counts = {};
    data.forEach(i => counts[i.nama_penemu.trim()] = (counts[i.nama_penemu.trim()] || 0) + 1);
    const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,10);

    let html = '<ul class="list-group list-group-flush">';
    sorted.forEach(([nama, skor], idx) => {
        const icon = idx === 0 ? '🥇' : (idx===1?'🥈':(idx===2?'🥉': `#${idx+1}`));
        html += `<li class="list-group-item bg-dark text-white d-flex justify-content-between border-secondary">
            <span>${icon} <strong>${nama}</strong></span>
            <span class="badge bg-warning text-dark">${skor}</span>
        </li>`;
    });
    html += '</ul>';
    modalBody.innerHTML = html;
}

// mulai aplikasi dengan memuat data
ambilData();
