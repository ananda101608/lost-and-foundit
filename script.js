// ==========================================
// 1. SETUP & KONEKSI
// ==========================================

const SUPABASE_URL = 'https://etiwybfhsmcwccfavgri.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0aXd5YmZoc21jd2NjZmF2Z3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDg3NDAsImV4cCI6MjA4NTcyNDc0MH0.Wm0Sbx-N7ZNg_pGoPyBmWi7XEqEzpHvXvOrQE2FJmWs';

// PERBAIKAN VITAL: Ganti nama variabel jadi 'db' agar tidak crash!
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const containerBarang = document.getElementById('container-barang');
const totalItemsBadge = document.getElementById('totalItems');
const formLapor = document.getElementById('formLapor');


// ==========================================
// 2. LOGIKA LAPOR (UPLOAD & INSERT)
// ==========================================

formLapor.addEventListener('submit', async (e) => {
    e.preventDefault(); // Mencegah halaman refresh sendiri
    
    const btn = formLapor.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    
    // Matikan tombol biar tidak dipencet 2x
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Mengirim...`;

    try {
        const nama = document.getElementById('inputNama').value;
        const kategori = document.getElementById('inputKategori').value;
        const lokasi = document.getElementById('inputLokasi').value;
        const wa = document.getElementById('inputWA').value;
        const file = document.getElementById('inputFoto').files[0];

        if (!file) throw new Error("Wajib pilih foto bukti!");

        // A. Upload Foto ke Bucket 'barang-foto'
        const fileName = `${Date.now()}_${file.name.replace(/\s/g, '')}`;
        
        // Gunakan 'db' bukan 'supabase'
        const { error: uploadError } = await db.storage 
            .from('barang-foto')
            .upload(fileName, file);
            
        if (uploadError) throw new Error("Gagal Upload Foto: " + uploadError.message);

        // B. Ambil URL Foto
        const { data: urlData } = db.storage
            .from('barang-foto')
            .getPublicUrl(fileName);

        // C. Masukkan ke Tabel 'items'
        // Ingat: Nama kolom sesuai screenshot Anda (1002980846.jpg) adalah 'nama_barang'
        const { error: dbError } = await db
            .from('items')
            .insert([{
                nama_barang: nama, 
                kategori: kategori,
                lokasi: lokasi,
                whatsapp: wa,
                foto_url: urlData.publicUrl,
                status: 'Tersedia'
                // deskripsi tidak perlu diisi (otomatis null)
            }]);

        if (dbError) throw new Error("Gagal Database: " + dbError.message);

        // SUKSES!
        alert("✅ ALHAMDULILLAH! Barang berhasil dilaporkan.");
        location.reload();

    } catch (err) {
        console.error(err);
        alert("❌ GAGAL LAPOR:\n" + err.message);
        
        // Hidupkan tombol lagi
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});


// ==========================================
// 3. LOGIKA AMBIL DATA (TAMPILKAN)
// ==========================================

async function ambilData(keyword = '', kategori = '') {
    containerBarang.innerHTML = `<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div><p>Memuat data...</p></div>`;

    // Gunakan 'db' di sini juga
    let query = db
        .from('items')
        .select('*')
        .eq('status', 'Tersedia')
        .order('id', { ascending: false });

    if (keyword) query = query.ilike('nama_barang', `%${keyword}%`);
    if (kategori) query = query.eq('kategori', kategori);

    const { data, error } = await query;

    if (error) {
        containerBarang.innerHTML = `<div class="col-12 text-center text-danger py-5">Error: ${error.message}</div>`;
        return;
    }

    renderKartu(data);
}

function renderKartu(items) {
    totalItemsBadge.innerText = `${items.length} Item`;

    if (!items || items.length === 0) {
        containerBarang.innerHTML = `<div class="col-12 text-center py-5 text-secondary"><h4>Belum ada barang hilang.</h4></div>`;
        return;
    }

    containerBarang.innerHTML = '';
    items.forEach(item => {
        const kartu = `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="card-item h-100 d-flex flex-column">
                    <div class="card-img-wrapper">
                        <img src="${item.foto_url}" class="card-img-top" style="height: 200px; object-fit: cover;">
                        <span class="category-badge">${item.kategori}</span>
                    </div>
                    <div class="p-3 flex-grow-1">
                        <h6 class="fw-bold text-white mb-1">${item.nama_barang}</h6>
                        <small class="text-secondary d-block mb-3">${item.lokasi}</small>
                        <a href="https://wa.me/${item.whatsapp}" target="_blank" class="btn btn-primary btn-sm w-100 rounded-pill">Hubungi</a>
                    </div>
                </div>
            </div>`;
        containerBarang.innerHTML += kartu;
    });
}

// Fungsi Cari & Filter
function cariBarang() {
    const keyword = document.getElementById('searchInput').value;
    ambilData(keyword, '');
}

function filterKategori(kategori) {
    document.querySelectorAll('.filter-chip').forEach(el => el.classList.remove('active'));
    event.target.classList.add('active');
    ambilData('', kategori);
}

// Jalankan saat awal
ambilData();
