// 1. SETUP
const SUPABASE_URL = 'https://etiwybfhsmcwccfavgri.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0aXd5YmZoc21jd2NjZmF2Z3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDg3NDAsImV4cCI6MjA4NTcyNDc0MH0.Wm0Sbx-N7ZNg_pGoPyBmWi7XEqEzpHvXvOrQE2FJmWs';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const containerBarang = document.getElementById('container-barang');
const totalItemsBadge = document.getElementById('totalItems');
const formLapor = document.getElementById('formLapor');

// 2. FORM SUBMIT (INI BAGIAN KRUSIAL)
formLapor.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = formLapor.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `⏳ Sedang Mengirim...`;

    try {
        const nama = document.getElementById('inputNama').value;
        const kategori = document.getElementById('inputKategori').value;
        const lokasi = document.getElementById('inputLokasi').value;
        const wa = document.getElementById('inputWA').value;
        const file = document.getElementById('inputFoto').files[0];

        // Cek file
        if (!file) throw new Error("Foto wajib dipilih!");

        // A. UPLOAD FOTO
        const fileName = `${Date.now()}_${file.name.replace(/\s/g, '')}`;
        const { error: uploadError } = await supabase.storage
            .from('barang-foto')
            .upload(fileName, file);

        if (uploadError) throw new Error("Gagal Upload Foto: " + uploadError.message);

        const { data: urlData } = supabase.storage
            .from('barang-foto')
            .getPublicUrl(fileName);

        // B. SIMPAN KE DATABASE (SESUAI GAMBAR 1002980846.jpg)
        const { error: dbError } = await supabase
            .from('items') // Nama tabel sudah benar
            .insert([{
                nama_barang: nama,  // WAJIB 'nama_barang' SESUAI GAMBAR 6
                kategori: kategori,
                lokasi: lokasi,
                whatsapp: wa,
                foto_url: urlData.publicUrl,
                status: 'Tersedia'
                // deskripsi tidak perlu dikirim karena di DB sudah "Nullable" (Boleh Kosong)
            }]);

        if (dbError) throw new Error("Gagal Database: " + dbError.message + " | Code: " + dbError.code);

        alert("✅ SUKSES! Barang berhasil dilaporkan.");
        location.reload();

    } catch (err) {
        // TAMPILKAN ERROR LENGKAP DI LAYAR
        console.error(err);
        alert("❌ TERJADI ERROR:\n" + err.message);
        
        // Kembalikan tombol
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});

// 3. READ DATA
async function ambilData(keyword = '', kategori = '') {
    containerBarang.innerHTML = `<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>`;

    let query = supabase.from('items').select('*').eq('status', 'Tersedia').order('id', { ascending: false });
    if (keyword) query = query.ilike('nama_barang', `%${keyword}%`);
    if (kategori) query = query.eq('kategori', kategori);

    const { data, error } = await query;
    if (error) {
        containerBarang.innerHTML = `<div class="text-danger text-center">Gagal: ${error.message}</div>`;
    } else {
        renderKartu(data);
    }
}

function renderKartu(items) {
    totalItemsBadge.innerText = `${items.length} Item`;
    if (items.length === 0) {
        containerBarang.innerHTML = `<div class="text-center py-5 text-white">Belum ada barang.</div>`;
        return;
    }
    containerBarang.innerHTML = '';
    items.forEach(item => {
        containerBarang.innerHTML += `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="card-item h-100">
                    <img src="${item.foto_url}" class="card-img-top" style="height:200px; object-fit:cover;">
                    <div class="p-3">
                        <h6 class="text-white">${item.nama_barang}</h6>
                        <small class="text-secondary">${item.lokasi}</small>
                        <a href="https://wa.me/${item.whatsapp}" class="btn btn-primary btn-sm w-100 mt-2">Hubungi</a>
                    </div>
                </div>
            </div>`;
    });
}

// Jalankan
ambilData();
