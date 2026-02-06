
const SUPABASE_URL = 'https://etiwybfhsmcwccfavgri.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wFz0i1y4bGnuxAzqICAqLA_gp7tnW23';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const containerBarang = document.getElementById('container-barang');
const totalItemsBadge = document.getElementById('totalItems');
const formLapor = document.getElementById('formLapor');



async function ambilData(keyword = '', kategori = '') {
    containerBarang.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
        </div>
    `;

   
    let query = supabase
        .from('items')
        .select('*')
        .eq('status', 'Belum dotemukan pemilik nya') 
        .order('id', { ascending: false });

    if (keyword) query = query.ilike('nama_barang', `%${keyword}%`);
    if (kategori) query = query.eq('kategori', kategori);

    const { data, error } = await query;

    if (error) {
        console.error("Error:", error);
        containerBarang.innerHTML = `<div class="col-12 text-center text-danger">Gagal memuat data.</div>`;
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
                <p class="text-secondary">Semua barang aman atau sudah kembali ke pemiliknya.</p>
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
                        <img src="${item.foto_url}" class="card-img-top" loading="lazy">
                        <span class="category-badge">${item.kategori}</span>
                    </div>
                    
                    <div class="p-3 flex-grow-1">
                        <h6 class="fw-bold text-white text-truncate mb-1">${item.nama_barang}</h6>
                        <div class="d-flex align-items-center text-secondary small mb-3">
                            <i class="bi bi-geo-alt-fill me-1 text-primary"></i> ${item.lokasi}
                        </div>
                        
                        <div class="d-grid gap-2">
                            <a href="https://wa.me/${item.whatsapp}" target="_blank" class="btn btn-primary btn-sm rounded-pill fw-bold">
                                <i class="bi bi-whatsapp me-1"></i> Hubungi Penemu
                            </a>
                            
                            <button onclick="tandaiSelesai(${item.id})" class="btn btn-outline-success btn-sm rounded-pill fw-bold" style="border-width: 1px;">
                                <i class="bi bi-check-circle-fill me-1"></i> Sudah Kembali
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
    const yakin = confirm("Apakah barang ini benar-benar sudah kembali ke pemiliknya?\n\nData akan disembunyikan dari halaman utama.");
    
    if (!yakin) return; 
    const { error } = await supabase
        .from('items')
        .update({ status: 'Sudah Kembali' }) 
        .eq('id', idBarang); 
    if (error) {
        alert("Gagal mengupdate status: " + error.message);
    } else {
        alert("Alhamdulillah! Barang berhasil dikonfirmasi kembali.");
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
        const { error: uploadError } = await supabase.storage.from('barang-foto').upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('barang-foto').getPublicUrl(fileName);

        const { error: dbError } = await supabase.from('items').insert([{
            nama_barang: nama,
            kategori: kategori,
            lokasi: lokasi,
            whatsapp: wa,
            foto_url: urlData.publicUrl,
            status: 'Tersedia' 
        }]);

        if (dbError) throw dbError;

        alert("Berhasil memposting barang!");
        location.reload();

    } catch (err) {
        alert("Error: " + err.message);
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});

ambilData();
