// --- konfigurasi database supabase ---
const SUPABASE_URL = 'https://etiwybfhsmcwccfavgri.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0aXd5YmZoc21jd2NjZmF2Z3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDg3NDAsImV4cCI6MjA4NTcyNDc0MH0.Wm0Sbx-N7ZNg_pGoPyBmWi7XEqEzpHvXvOrQE2FJmWs';

// buat koneksi ke supabase
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- state aplikasi ---
let activeMode = 'TEMUAN'; // defaultnya nampilin barang temuan dulu
let currentFilter = '';

// --- ambil elemen yg butuh diakses nanti ---
const body = document.body;
const containerBarang = document.getElementById('container-barang');
const switchContainer = document.getElementById('switchContainer');



function gantiMode(mode) {
    activeMode = mode;
    
    // ambil tombol switch
    const btnTemuan = document.getElementById('btnSwitchTemuan');
    const btnKehilangan = document.getElementById('btnSwitchKehilangan');
    
    // cek mau mode apa
    if (mode === 'TEMUAN') {
        // ubah tampilan jadi tema biru/ungu
        body.classList.remove('mode-lost');
        switchContainer.classList.remove('lost-mode');
        btnTemuan.classList.add('active');
        btnKehilangan.classList.remove('active');
        
        // update teks di halaman
        document.getElementById('textLaporHome').innerText = "Lapor Penemuan";
        document.getElementById('headerTitle').innerText = "Barang Ditemukan";
    } else {
        // ubah tampilan jadi tema merah/oren
        body.classList.add('mode-lost');
        switchContainer.classList.add('lost-mode');
        btnTemuan.classList.remove('active');
        btnKehilangan.classList.add('active');
        
        // update teks di halaman
        document.getElementById('textLaporHome').innerText = "Lapor Kehilangan";
        document.getElementById('headerTitle').innerText = "Info Kehilangan";
    }
    
    // ambil data ulang sesuai mode baru
    ambilData();
}


function bukaModalLapor() {
    // ambil semua elemen di form biar bisa diedit teksnya
    const modalTitle = document.getElementById('modalTitle');
    const labelLokasi = document.getElementById('labelLokasiInput');
    const labelWaktu = document.getElementById('labelWaktuInput');
    const labelUser = document.getElementById('labelUserInput');
    const btnSubmit = document.getElementById('btnSubmitLapor');
    const inputFoto = document.getElementById('inputFoto');
    const labelFoto = document.getElementById('labelFoto');
    const hintFoto = document.getElementById('hintFoto');

    // bersihin form dulu sebelum dibuka
    document.getElementById('formLapor').reset();

    if (activeMode === 'TEMUAN') {
        // atur teks buat mode temuan
        modalTitle.innerText = "📝 Lapor Penemuan Barang";
        labelLokasi.innerText = "LOKASI DITEMUKAN";
        labelWaktu.innerText = "WAKTU DITEMUKAN";
        labelUser.innerText = "NAMA PENEMU (KAMU)";
        btnSubmit.innerText = "POSTING TEMUAN";
        
        // foto wajib kalo nemu barang
        labelFoto.innerText = "FOTO BARANG (Wajib)";
        inputFoto.required = true;
        hintFoto.style.display = 'none';
    } else {
        // atur teks buat mode kehilangan
        modalTitle.innerText = "🆘 Lapor Kehilangan Barang";
        labelLokasi.innerText = "TERAKHIR DILIHAT / HILANG DI";
        labelWaktu.innerText = "PERKIRAAN WAKTU HILANG";
        labelUser.innerText = "NAMA PEMILIK (KAMU)";
        btnSubmit.innerText = "POSTING INFO KEHILANGAN";
        
      
        labelFoto.innerText = "FOTO BARANG (Opsional)";
        inputFoto.required = false;
        hintFoto.style.display = 'block';
    }
    
    // tampilin modalnya
    const myModal = new bootstrap.Modal(document.getElementById('modalLapor'));
    myModal.show();
}



async function ambilData(keyword = '', kategori = '') {
    // kasih loading dulu biar user tau
    containerBarang.innerHTML = `<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>`;

    // query ke supabase: ambil barang yg statusnya 'tersedia' dan tipenya sesuai mode aktif
    let query = db
        .from('items')
        .select('*')
        .eq('status', 'Tersedia')
        .eq('tipe', activeMode) 
        .order('id', { ascending: false });

    // kalo ada pencarian atau filter kategori
    if (keyword) query = query.ilike('nama_barang', `%${keyword}%`);
    if (kategori) query = query.eq('kategori', kategori);

    const { data, error } = await query;

    // kalo error, kasih tau user
    if (error) {
        containerBarang.innerHTML = `<div class="text-white text-center">Gagal: ${error.message}</div>`;
        return;
    }

    renderKartu(data);
}

function renderKartu(items) {
    // update jumlah item di header
    document.getElementById('totalItems').innerText = `${items.length} Item`;

    // kalo kosong, kasih pesan yg sesuai
    if (!items || items.length === 0) {
        const pesan = activeMode === 'TEMUAN' ? "Belum ada barang ditemukan." : "Alhamdulillah, tidak ada info kehilangan lurr.";
        containerBarang.innerHTML = `<div class="text-center py-5 text-white opacity-50"><i class="bi bi-box2 fs-1"></i><p>${pesan}</p></div>`;
        return;
    }

    containerBarang.innerHTML = '';
    
    // loop datanya trus bikin kartu satu-satu
    items.forEach((item, index) => {
        const itemString = encodeURIComponent(JSON.stringify(item));
        const delay = index * 0.1; // delay dikit biar animasinya gantian
        
        // pake gambar placeholder kalo gak ada fotonya
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
    
    // sesuaikan label berdasarkan mode
    document.getElementById('labelLokasi').innerText = isFound ? "LOKASI DITEMUKAN" : "TERAKHIR DILIHAT";
    document.getElementById('labelWaktu').innerText = isFound ? "WAKTU DITEMUKAN" : "WAKTU HILANG";
    document.getElementById('labelUser').innerText = isFound ? "DIAMANKAN OLEH" : "DICARI OLEH (PEMILIK)";
    
    // isi datanya ke elemen html
    let gambar = item.foto_url || 'https://placehold.co/600x600/1e293b/FFF?text=No+Image';
    document.getElementById('detail-img').src = gambar;
    document.getElementById('detail-judul').innerText = item.nama_barang;
    document.getElementById('detail-kategori').innerText = item.kategori;
    document.getElementById('detail-lokasi').innerText = item.lokasi;
    document.getElementById('detail-user').innerText = item.nama_penemu || "-";
    document.getElementById('detail-deskripsi').innerText = item.deskripsi || "Tidak ada deskripsi tambahan.";
    
    // format tanggal biar enak dibaca
    const tanggal = item.waktu_ditemukan ? new Date(item.waktu_ditemukan).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }) : '-';
    document.getElementById('detail-waktu').innerText = tanggal;

    // atur tombol aksi (WA dan Hapus)
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

    // animasi transisi halaman
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

    // tentukan status akhir
    const statusAkhir = activeMode === 'TEMUAN' ? 'Sudah Kembali' : 'Sudah Ditemukan';
    
    // update ke database
    const { error } = await db.from('items').update({ status: statusAkhir }).eq('id', idBarang);

    if (error) alert("Error: " + error.message);
    else {
        alert("✅ Berhasil! Status diperbarui.");
        tutupDetail();
        ambilData();
    }
}

// listener buat form submit
document.getElementById('formLapor').addEventListener('submit', async (e) => {
    e.preventDefault(); // tahan biar gak refresh
    
    const btn = document.getElementById('btnSubmitLapor');
    const originalText = btn.innerText;
    
    // matiin tombol biar gak double click
    btn.disabled = true;
    btn.innerText = "⏳ Mengirim...";

    try {
        const file = document.getElementById('inputFoto').files[0];
        let fotoUrl = null;

        // cek ada foto gak
        if (file) {
            // bikin nama file unik pake timestamp
            const fileName = `${Date.now()}_${file.name.replace(/\s/g, '')}`;
            
            // upload ke storage supabase
            const { error: upErr } = await db.storage.from('barang-foto').upload(fileName, file);
            if (upErr) throw new Error("Gagal Upload Foto");
            
            // ambil link fotonya
            const { data } = db.storage.from('barang-foto').getPublicUrl(fileName);
            fotoUrl = data.publicUrl;
        } else {
            // validasi: kalo mode temuan, wajib ada foto
            if (activeMode === 'TEMUAN') throw new Error("Foto wajib untuk barang temuan!");
        }

        // simpan data ke tabel items
        const { error } = await db.from('items').insert([{
            nama_barang: document.getElementById('inputNama').value,
            kategori: document.getElementById('inputKategori').value,
            lokasi: document.getElementById('inputLokasi').value,
            whatsapp: document.getElementById('inputWA').value,
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
    
    // loading dulu
    modalBody.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>`;

    // ambil data barang yg udah kembali
    const { data, error } = await db
        .from('items')
        .select('nama_penemu')
        .eq('status', 'Sudah Kembali')
        .eq('tipe', 'TEMUAN');

    if (error || !data) {
        modalBody.innerHTML = `<p class="text-center py-4 text-danger">Gagal memuat data.</p>`;
        return;
    }

    // hitung jumlah laporan per orang
    const counts = {};
    data.forEach(item => {
        const nama = item.nama_penemu.trim(); 
        counts[nama] = (counts[nama] || 0) + 1;
    });

    // urutin dari yg terbanyak, ambil 10 besar
    const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    if (sorted.length === 0) {
        modalBody.innerHTML = `<div class="text-center py-5 text-muted"><i class="bi bi-emoji-frown fs-1"></i><p>Belum ada pahlawan.</p></div>`;
        return;
    }

    // bikin html buat list juaranya
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

// fungsi pencarian
function cariBarang() {
    const val = document.getElementById('searchInput').value;
    ambilData(val, currentFilter);
}

// fungsi filter kategori
function filterKategori(btn, kat) {
    document.querySelectorAll('.filter-chip').forEach(el => el.classList.remove('active'));
    if(btn) btn.classList.add('active');
    currentFilter = kat;
    ambilData('', kat);
}

// jalanin pas awal buka web
ambilData();
