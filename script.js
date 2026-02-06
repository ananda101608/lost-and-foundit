const SUPABASE_URL = 'https://etiwybfhsmcwccfavgri.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0aXd5YmZoc21jd2NjZmF2Z3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDg3NDAsImV4cCI6MjA4NTcyNDc0MH0.Wm0Sbx-N7ZNg_pGoPyBmWi7XEqEzpHvXvOrQE2FJmWs';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const containerBarang = document.getElementById('container-barang');
const totalItemsBadge = document.getElementById('totalItems');
const formLapor = document.getElementById('formLapor');

async function ambilData(keyword = '', kategori = '') {
    containerBarang.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 text-secondary">Sedang memuat data...</p>
        </div>
    `;

    let query = supabase
        .from('items')
        .select('*')
        .eq('status', 'Tersedia')
        .order('id', { ascending: false });

    if (keyword) query = query.ilike('nama_barang', `%${keyword}%`);
    if (kategori) query = query.eq('kategori', kategori);

    const { data, error } = await query;

    if (error) {
        console.error("Error mengambil data:", error);
        containerBarang.innerHTML = `
            <div class="col-12 text-center text-danger py-5">
                <h4>Gagal Memuat Data</h4>
                <p>Pesan Error: ${error.message}</p>
                <small>Pastikan RLS sudah dimatikan di Supabase.</small>
            </div>`;
        return;
    }

    renderKartu(data);
}

function renderKartu(items) {
    totalItemsBadge.innerText = `${items.length} Item`;

    if (items.length === 0) {
        containerBarang.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-box2 display-1 text-secondary opacity-25"></i>
                <h4 class="mt-3 text-white">Tidak ada barang ditemukan</h4>
                <p class="text-secondary">Semua barang aman atau belum ada yang lapor.</p>
            </div>
        `;
        return;
    }

    containerBarang.innerHTML = '';

    items.forEach(item => {
        const kartu = `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="card-item h-100 d-flex flex-column">
                    <div class="card-img-wrapper">
                        <img src="${item.foto_url}" class="card-img-top" loading="lazy" onerror="this.src='https://via.placeholder.com/300?text=Foto+Rusak'">
                        <span class="category-badge">${item.kategori}</span>
                    </div>
                    
                    <div class="p-3 flex-grow-1">
                        <h6 class="fw-bold text-white text-truncate mb-1">${item.nama_barang}</h6>
                        <div class="d-flex align-items-center text-secondary small mb-3">
                            <i class="bi bi-geo-alt-fill me-1 text-primary"></i> ${item.lokasi}
                        </div>
                        
                        <div class="d-grid gap-2">
                            <a href="https://wa.me/${item.whatsapp}" target="_blank" class="btn btn-primary btn-sm rounded-pill fw-bold">
                                <i class="bi bi-whatsapp me-1"></i> Hubungi
                            </a>
                            
                            <button onclick="tandaiSelesai(${item.id})" class="btn btn-outline-success btn-sm rounded-pill fw-bold" style="border-width: 1px;">
                                <i class="bi bi-check-circle-fill me-1"></i> Selesai
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        containerBarang.innerHTML += kartu;
    });
}

async function tandaiSelesai(idBarang) {
    const yakin = confirm("Apakah barang ini sudah kembali ke pemiliknya?");
    if (!yakin) return; 

    const { error } = await supabase
        .from('items')
        .update({ status: 'Sudah Kembali' }) 
        .eq('id', idBarang); 

    if (error) {
        alert("Gagal update: " + error.message);
    } else {
        alert("Berhasil! Data akan hilang dari daftar.");
        ambilData(); 
    }
}

function cariBarang() {
    const keyword = document.getElementById('searchInput').value;
    ambilData(keyword, '');
}

function filterKategori(kategori) {
    document.querySelectorAll('.filter-chip').forEach(el => el.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('searchInput').value = '';
    ambilData('', kategori);
}

formLapor.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = formLapor.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Mengupload...`;

    try {
        const nama = document.getElementById('inputNama').value;
        const kategori = document.getElementById('inputKategori').value;
        const lokasi = document.getElementById('inputLokasi').value;
        const wa = document.getElementById('inputWA').value;
        const file = document.getElementById('inputFoto').files[0];

        const fileName = `${Date.now()}_${file.name.replace(/\s/g, '')}`;
        
        const { error: uploadError } = await supabase.storage
            .from('barang-foto')
            .upload(fileName, file);
            
        if (uploadError) throw new Error("Gagal Upload Foto: " + uploadError.message);

        const { data: urlData } = supabase.storage
            .from('barang-foto')
            .getPublicUrl(fileName);

        const { error: dbError } = await supabase
            .from('items')
            .insert([{
                nama_barang: nama,
                kategori: kategori,
                lokasi: lokasi,
                whatsapp: wa, 
                foto_url: urlData.publicUrl,
                status: 'Tersedia' 
            }]);

        if (dbError) throw new Error("Gagal Simpan Database: " + dbError.message);

        alert("✅ Berhasil memposting barang!");
        location.reload();

    } catch (err) {
        alert("❌ TERJADI ERROR:\n" + err.message);
        console.error(err);
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});

ambilData();
