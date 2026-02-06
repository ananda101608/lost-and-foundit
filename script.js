const SUPABASE_URL = 'https://etiwybfhsmcwccfavgri.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0aXd5YmZoc21jd2NjZmF2Z3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDg3NDAsImV4cCI6MjA4NTcyNDc0MH0.Wm0Sbx-N7ZNg_pGoPyBmWi7XEqEzpHvXvOrQE2FJmWs';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const containerBarang = document.getElementById('container-barang');
const formLapor = document.getElementById('formLapor');
const homeView = document.getElementById('home-view');
const detailView = document.getElementById('detail-view');
const actionButtons = document.getElementById('action-buttons');

function bukaDetail(itemJson) {
    const item = JSON.parse(decodeURIComponent(itemJson));

    document.getElementById('detail-img').src = item.foto_url;
    document.getElementById('detail-judul').innerText = item.nama_barang;
    document.getElementById('detail-kategori').innerText = item.kategori;
    document.getElementById('detail-lokasi').innerText = item.lokasi;
    document.getElementById('detail-penemu').innerText = item.nama_penemu || "Hamba Allah";

    const tanggal = item.waktu_ditemukan ? 
        new Date(item.waktu_ditemukan).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }) : 'Baru saja';
    document.getElementById('detail-waktu').innerText = tanggal;

    actionButtons.innerHTML = `
        <a href="https://wa.me/${item.whatsapp}" target="_blank" class="btn btn-primary flex-grow-1 fw-bold py-2 rounded-3">
            <i class="bi bi-whatsapp me-2"></i> Hubungi
        </a>
        
        <button onclick="barangSudahKembali(${item.id})" class="btn btn-danger py-2 rounded-3" style="width: 50px;">
            <i class="bi bi-trash-fill"></i>
        </button>
    `;

    homeView.classList.add('inactive');
    detailView.classList.add('active');
}

function tutupDetail() {
    detailView.classList.remove('active');
    homeView.classList.remove('inactive');
}

async function barangSudahKembali(idBarang) {
    const yakin = confirm("⚠️ PERINGATAN!\n\nApakah Anda yakin pemilik barang ini sudah ditemukan?\nJika 'OK', postingan ini akan dihapus dari halaman utama.");
    
    if (!yakin) return;

    const { error } = await db
        .from('items')
        .update({ status: 'Sudah Kembali' }) 
        .eq('id', idBarang);

    if (error) {
        alert("Gagal update status: " + error.message);
    } else {
        alert("✅ Alhamdulillah! Barang telah ditandai kembali.");
        tutupDetail();
        ambilData();
    }
}

async function ambilData(keyword = '', kategori = '') {
    containerBarang.innerHTML = `<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>`;

    let query = db
        .from('items')
        .select('*')
        .eq('status', 'Tersedia') 
        .order('id', { ascending: false });

    if (keyword) query = query.ilike('nama_barang', `%${keyword}%`);
    if (kategori) query = query.eq('kategori', kategori);

    const { data, error } = await query;

    if (error) {
        containerBarang.innerHTML = `<div class="text-danger text-center">Gagal memuat: ${error.message}</div>`;
        return;
    }

    renderKartu(data);
}

function renderKartu(items) {
    document.getElementById('totalItems').innerText = `${items.length}`;

    if (!items || items.length === 0) {
        containerBarang.innerHTML = `<div class="text-center py-5 text-secondary">Belum ada barang hilang.</div>`;
        return;
    }

    containerBarang.innerHTML = '';
    
    items.forEach(item => {
        const itemString = encodeURIComponent(JSON.stringify(item));

        const kartu = `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="card-item h-100 d-flex flex-column" onclick="bukaDetail('${itemString}')">
                    <div class="card-img-wrapper">
                        <img src="${item.foto_url}" class="card-img-top" loading="lazy">
                        <span class="category-badge">${item.kategori}</span>
                    </div>
                    <div class="p-3">
                        <h6 class="fw-bold text-white text-truncate mb-1">${item.nama_barang}</h6>
                        <div class="d-flex align-items-center text-secondary small">
                            <i class="bi bi-geo-alt-fill me-1 text-primary"></i> ${item.lokasi}
                        </div>
                    </div>
                </div>
            </div>`;
        containerBarang.innerHTML += kartu;
    });
}

formLapor.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = formLapor.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `⏳ Mengirim...`;

    try {
        const nama = document.getElementById('inputNama').value;
        const kategori = document.getElementById('inputKategori').value;
        const lokasi = document.getElementById('inputLokasi').value;
        const wa = document.getElementById('inputWA').value;
        const penemu = document.getElementById('inputPenemu').value;
        const waktu = document.getElementById('inputWaktu').value;
        const file = document.getElementById('inputFoto').files[0];

        if (!file) throw new Error("Foto wajib ada!");

        const fileName = `${Date.now()}_${file.name.replace(/\s/g, '')}`;
        const { error: uploadError } = await db.storage.from('barang-foto').upload(fileName, file);
        if (uploadError) throw new Error("Gagal Upload Foto");

        const { data: urlData } = db.storage.from('barang-foto').getPublicUrl(fileName);

        const { error: dbError } = await db.from('items').insert([{
            nama_barang: nama,
            kategori: kategori,
            lokasi: lokasi,
            whatsapp: wa,
            foto_url: urlData.publicUrl,
            status: 'Tersedia',
            nama_penemu: penemu,
            waktu_ditemukan: waktu
        }]);

        if (dbError) throw new Error(dbError.message);

        alert("✅ Berhasil! Data tersimpan.");
        location.reload();

    } catch (err) {
        alert("❌ Error: " + err.message);
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});

function cariBarang() {
    const val = document.getElementById('searchInput').value;
    ambilData(val, '');
}
function filterKategori(kat) {
    ambilData('', kat);
}

ambilData();
