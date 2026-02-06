// 1. SETUP KONEKSI
const SUPABASE_URL = 'https://etiwybfhsmcwccfavgri.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0aXd5YmZoc21jd2NjZmF2Z3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDg3NDAsImV4cCI6MjA4NTcyNDc0MH0.Wm0Sbx-N7ZNg_pGoPyBmWi7XEqEzpHvXvOrQE2FJmWs';

// buat koneksi
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- state aplikasi ---
let activeMode = 'TEMUAN'; 
let currentFilter = '';

// --- ambil elemen penting ---
const body = document.body;
const containerBarang = document.getElementById('container-barang');
const switchContainer = document.getElementById('switchContainer');



function gantiMode(mode) {
    activeMode = mode;
    
    const btnTemuan = document.getElementById('btnSwitchTemuan');
    const btnKehilangan = document.getElementById('btnSwitchKehilangan');
    
    if (mode === 'TEMUAN') {
        body.classList.remove('mode-lost');
        switchContainer.classList.remove('lost-mode');
        btnTemuan.classList.add('active');
        btnKehilangan.classList.remove('active');
        
        document.getElementById('textLaporHome').innerText = "Lapor Penemuan";
        document.getElementById('headerTitle').innerText = "Barang Ditemukan";
    } else {
        body.classList.add('mode-lost');
        switchContainer.classList.add('lost-mode');
        btnTemuan.classList.remove('active');
        btnKehilangan.classList.add('active');
        
        document.getElementById('textLaporHome').innerText = "Lapor Kehilangan";
        document.getElementById('headerTitle').innerText = "Info Kehilangan";
    }
    
    ambilData();
}



function bukaModalLapor() {
    const modalTitle = document.getElementById('modalTitle');
    const labelLokasi = document.getElementById('labelLokasiInput');
    const labelWaktu = document.getElementById('labelWaktuInput');
    const labelUser = document.getElementById('labelUserInput');
    const btnSubmit = document.getElementById('btnSubmitLapor');
    const inputFoto = document.getElementById('inputFoto');
    const labelFoto = document.getElementById('labelFoto');
    const hintFoto = document.getElementById('hintFoto');

    document.getElementById('formLapor').reset();

    if (activeMode === 'TEMUAN') {
        modalTitle.innerText = "📝 Lapor Penemuan Barang";
        labelLokasi.innerText = "LOKASI DITEMUKAN";
        labelWaktu.innerText = "WAKTU DITEMUKAN";
        labelUser.innerText = "NAMA PENEMU (KAMU)";
        btnSubmit.innerText = "POSTING TEMUAN";
        
        labelFoto.innerText = "FOTO BARANG (Wajib)";
        inputFoto.required = true;
        hintFoto.style.display = 'none';
    } else {
        modalTitle.innerText = "🆘 Lapor Kehilangan Barang";
        labelLokasi.innerText = "TERAKHIR DILIHAT / HILANG DI";
        labelWaktu.innerText = "PERKIRAAN WAKTU HILANG";
        labelUser.innerText = "NAMA PEMILIK (KAMU)";
        btnSubmit.innerText = "POSTING INFO KEHILANGAN";
        
        labelFoto.innerText = "FOTO BARANG (Opsional)";
        inputFoto.required = false;
        hintFoto.style.display = 'block';
    }
    
    const myModal = new bootstrap.Modal(document.getElementById('modalLapor'));
    myModal.show();
}



async function ambilData(keyword = '', kategori = '') {
    containerBarang.innerHTML = `<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>`;

    let query = db
        .from('items')
        .select('*')
        .eq('status', 'Tersedia')
        .eq('tipe', activeMode) 
        .order('id', { ascending: false });

    if (keyword) query = query.ilike('nama_barang', `%${keyword}%`);
    if (kategori) query = query.eq('kategori', kategori);

    const { data, error } = await query;

    if (error) {
        containerBarang.innerHTML = `<div class="text-white text-center">Gagal: ${error.message}</div>`;
        return;
    }

    renderKartu(data);
}

function renderKartu(items) {
    document.getElementById('totalItems').innerText = `${items.length} Item`;

    if (!items || items.length === 0) {
        const pesan = activeMode === 'TEMUAN' ? "Belum ada barang ditemukan." : "Alhamdulillah, tidak ada info kehilangan.";
        containerBarang.innerHTML = `<div class="text-center py-5 text-white opacity-50"><i class="bi bi-box2 fs-1"></i><p>${pesan}</p></div>`;
        return;
    }

    containerBarang.innerHTML = '';
    
    items.forEach((item, index) => {
        const itemString = encodeURIComponent(JSON.stringify(item));
        const delay = index * 0.1;
        
        let gambar = item.foto_url || 'https://placehold.co/400x400/1e293b/FFF?text=No+Image';

        const kartu = `
            <div class="col-6 col-md-4 col-lg-3 animate-in" style="animation-delay: ${delay}s">
                <div class="card-item h-100 d-flex flex-column" onclick="bukaDetail('${itemString}')">
                    <div class="card-img-wrapper">
                        <img src="${gambar}" class="card-img-top" loading="lazy">
                        <span class="category-badge">${item.kategori}</span>
                    </div>
                    <div class="p-3">
                        <h6 class="fw-bold text-white text-truncate mb-1">${item.nama_barang}</h6>
                        <small class="text-muted d-block">${item.lokasi}</small>
                    </div>
                </div>
            </div>`;
        containerBarang.innerHTML += kartu;
    });
}



function bukaDetail(itemJson) {
    const item = JSON.parse(decodeURIComponent(itemJson));
    const isFound = item.tipe === 'TEMUAN';
    
    document.getElementById('labelLokasi').innerText = isFound ? "LOKASI DITEMUKAN" : "TERAKHIR DILIHAT";
    document.getElementById('labelWaktu').innerText = isFound ? "WAKTU DITEMUKAN" : "WAKTU HILANG";
    document.getElementById('labelUser').innerText = isFound ? "DIAMANKAN OLEH" : "DICARI OLEH (PEMILIK)";
    
    let gambar = item.foto_url || 'https://placehold.co/600x600/1e293b/FFF?text=No+Image';
    document.getElementById('detail-img').src = gambar;
    document.getElementById('detail-judul').innerText = item.nama_barang;
    document.getElementById('detail-kategori').innerText = item.kategori;
    document.getElementById('detail-lokasi').innerText = item.lokasi;
    document.getElementById('detail-user').innerText = item.nama_penemu || "-";
    document.getElementById('detail-deskripsi').innerText = item.deskripsi || "Tidak ada deskripsi tambahan.";
    
    const tanggal = item.waktu_ditemukan ? new Date(item.waktu_ditemukan).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }) : '-';
    document.getElementById('detail-waktu').innerText = tanggal;

    const actionContainer = document.getElementById('action-buttons');
    const btnColor = isFound ? 'btn-dynamic' : 'btn-danger';
    const textWA = isFound ? 'Hubungi Penemu' : 'Saya Menemukannya!';
    const textHapus = isFound ? 'Sudah Kembali?' : 'Sudah Ketemu?';

    actionContainer.innerHTML = `
        <div class="d-flex gap-2 w-100">
            <a href="https://wa.me/${item.whatsapp}" target="_blank" class="btn ${btnColor} flex-grow-1 fw-bold py-3 rounded-4 d-flex align-items-center justify-content-center gap-2 shadow-lg">
                <i class="bi bi-whatsapp fs-5"></i> ${textWA}
            </a>
            <button onclick="tandaiSelesai(${item.id})" class="btn btn-dark border border-secondary text-danger rounded-4 px-3" title="${textHapus}">
                <i class="bi bi-trash-fill fs-5"></i>
            </button>
        </div>
    `;

    document.getElementById('home-view').classList.add('inactive');
    document.getElementById('detail-view').classList.add('active');
}

function tutupDetail() {
    document.getElementById('detail-view').classList.remove('active');
    document.getElementById('home-view').classList.remove('inactive');
}



async function tandaiSelesai(idBarang) {
    const msg = activeMode === 'TEMUAN' 
        ? "Apakah barang ini SUDAH KEMBALI ke pemiliknya?" 
        : "Apakah barang ini SUDAH DITEMUKAN?";
        
    if (!confirm(msg)) return;

    const statusAkhir = activeMode === 'TEMUAN' ? 'Sudah Kembali' : 'Sudah Ditemukan';
    
    const { error } = await db.from('items').update({ status: statusAkhir }).eq('id', idBarang);

    if (error) alert("Error: " + error.message);
    else {
        alert("✅ Berhasil! Status diperbarui.");
        tutupDetail();
        ambilData();
    }
}

// kirim data pas tombol diklik
document.getElementById('formLapor').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSubmitLapor');
    const originalText = btn.innerText;
    
    btn.disabled = true;
    btn.innerText = "⏳ Mengirim...";

    try {
        const file = document.getElementById('inputFoto').files[0];
        let fotoUrl = null;

        if (file) {
            const fileName = `${Date.now()}_${file.name.replace(/\s/g, '')}`;
            const { error: upErr } = await db.storage.from('barang-foto').upload(fileName, file);
            if (upErr) throw new Error("Gagal Upload Foto");
            const { data } = db.storage.from('barang-foto').getPublicUrl(fileName);
            fotoUrl = data.publicUrl;
        } else {
            if (activeMode === 'TEMUAN') throw new Error("Foto wajib untuk barang temuan!");
        }

        // --- UPDATE PENTING: FORMAT NOMOR WA ---
        let rawWA = document.getElementById('inputWA').value;
        
        // 1. Hapus semua karakter aneh (spasi, strip, plus), sisakan angka saja
        let cleanWA = rawWA.replace(/\D/g, ''); 

        // 2. Kalo depannya '0', ganti jadi '62'
        if (cleanWA.startsWith('0')) {
            cleanWA = '62' + cleanWA.slice(1);
        }
        // 3. Kalo user lupa nulis '62' dan '0' (langsung 812...), tambahin '62'
        else if (!cleanWA.startsWith('62')) {
            cleanWA = '62' + cleanWA;
        }
        // --- SELESAI FORMAT WA ---

        const { error } = await db.from('items').insert([{
            nama_barang: document.getElementById('inputNama').value,
            kategori: document.getElementById('inputKategori').value,
            lokasi: document.getElementById('inputLokasi').value,
            whatsapp: cleanWA, // Pake nomor yg udah dibersihin
            waktu_ditemukan: document.getElementById('inputWaktu').value,
            nama_penemu: document.getElementById('inputPenemu').value,
            deskripsi: document.getElementById('inputDeskripsi').value,
            
            foto_url: fotoUrl,
            status: 'Tersedia',
            tipe: activeMode 
        }]);

        if (error) throw error;

        alert("✅ Berhasil Posting!");
        location.reload();

    } catch (err) {
        alert("❌ Error: " + err.message);
        btn.disabled = false;
        btn.innerText = originalText;
    }
});



async function bukaLeaderboard() {
    const modalBody = document.getElementById('leaderboardBody');
    const myModal = new bootstrap.Modal(document.getElementById('modalLeaderboard'));
    myModal.show();
    
    modalBody.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>`;

    const { data, error } = await db
        .from('items')
        .select('nama_penemu')
        .eq('status', 'Sudah Kembali')
        .eq('tipe', 'TEMUAN');

    if (error || !data) {
        modalBody.innerHTML = `<p class="text-center py-4 text-danger">Gagal memuat data.</p>`;
        return;
    }

    const counts = {};
    data.forEach(item => {
        const nama = item.nama_penemu.trim(); 
        counts[nama] = (counts[nama] || 0) + 1;
    });

    const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    if (sorted.length === 0) {
        modalBody.innerHTML = `<div class="text-center py-5 text-muted"><i class="bi bi-emoji-frown fs-1"></i><p>Belum ada pahlawan.</p></div>`;
        return;
    }

    let html = '';
    sorted.forEach(([nama, jumlah], index) => {
        const rankClass = index === 0 ? 'rank-1' : (index === 1 ? 'rank-2' : (index === 2 ? 'rank-3' : 'bg-dark'));
        const icon = index === 0 ? '👑' : `#${index + 1}`;
        
        html += `
            <div class="leaderboard-item">
                <div class="rank-badge ${rankClass}">${icon}</div>
                <div class="flex-grow-1 text-white fw-bold">${nama}</div>
                <div class="text-warning fw-bold">${jumlah} <small class="text-muted fw-normal">Item</small></div>
            </div>`;
    });

    modalBody.innerHTML = html;
}

function cariBarang() {
    const val = document.getElementById('searchInput').value;
    ambilData(val, currentFilter);
}

function filterKategori(btn, kat) {
    document.querySelectorAll('.filter-chip').forEach(el => el.classList.remove('active'));
    if(btn) btn.classList.add('active');
    currentFilter = kat;
    ambilData('', kat);
}

// mulai aplikasi
ambilData();
