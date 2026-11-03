let chartKesegaranInstance = null;
let chartPrioritasInstance = null;

const dataDashboardDummy = {
    totalBeratGudang: 834.2,
    totalBatchGudang: 42,
    rekapSegar: 18,
    rekapCukup: 13,
    rekapKritis: 11,
    totalKritis: 11,
    prioritasSingkat: [
        { komoditas: 'Bayam', lahan: 'Lahan A', berat: 50.9, sisaUmur: -1, status: 'Kritis' },
        { komoditas: 'Stroberi', lahan: 'Lahan A', berat: 60.4, sisaUmur: 0, status: 'Kritis' },
        { komoditas: 'Tomat', lahan: 'Greenhouse 1', berat: 149, sisaUmur: 1, status: 'Kritis' }
    ],
    volumeKomoditas: [
        { komoditas: 'Bayam', totalBerat: 260 },
        { komoditas: 'Cabai', totalBerat: 128 },
        { komoditas: 'Jagung Manis', totalBerat: 155 },
        { komoditas: 'Kangkung', totalBerat: 120 },
        { komoditas: 'Pisang', totalBerat: 145 },
        { komoditas: 'Stroberi', totalBerat: 160 },
        { komoditas: 'Tomat', totalBerat: 150 }
    ]
};

const dataRiwayatDummy = [
    { komoditas: 'Bayam', lahan: 'Lahan Blok A - Lembang', berat: 98.2, tanggalKirim: '2026-11-03', tujuan: 'Supermarket Ranch Market, Jakarta', statusKesegaran: 'Kritis' },
    { komoditas: 'Stroberi', lahan: 'Lahan Blok A - Lembang', berat: 58, tanggalKirim: '2026-11-03', tujuan: 'Probolinggo', statusKesegaran: 'Kritis' },
    { komoditas: 'Jagung Manis', lahan: 'Greenhouse 1', berat: 74.2, tanggalKirim: '2026-10-26', tujuan: 'Supermarket Segar, Surabaya', statusKesegaran: 'Segar' },
    { komoditas: 'Bayam', lahan: 'Lahan Blok B - Ciwidey', berat: 106.6, tanggalKirim: '2026-11-01', tujuan: 'Pasar Induk Caringin, Bandung', statusKesegaran: 'Cukup' },
    { komoditas: 'Stroberi', lahan: 'Greenhouse 1', berat: 10.8, tanggalKirim: '2026-10-31', tujuan: 'Supermarket Segar, Malang', statusKesegaran: 'Cukup' },
    { komoditas: 'Kangkung', lahan: 'Lahan A', berat: 74.3, tanggalKirim: '2026-10-26', tujuan: 'Pasar Induk Kramat Jati, Jakarta', statusKesegaran: 'Cukup' },
    { komoditas: 'Stroberi', lahan: 'Greenhouse 1', berat: 29.6, tanggalKirim: '2026-10-26', tujuan: 'Supermarket Segar, Kediri', statusKesegaran: 'Cukup' },
    { komoditas: 'Bayam', lahan: 'Greenhouse 1', berat: 17.6, tanggalKirim: '2026-10-26', tujuan: 'Supermarket Segar, Madiun', statusKesegaran: 'Cukup' },
    { komoditas: 'Cabai', lahan: 'Greenhouse 1', berat: 40.4, tanggalKirim: '2026-10-26', tujuan: 'Pasar Induk Puspa Agro, Sidoarjo', statusKesegaran: 'Segar' },
    { komoditas: 'Bayam', lahan: 'Lahan A', berat: 15.8, tanggalKirim: '2026-10-29', tujuan: 'Supermarket Segar, Banyuwangi', statusKesegaran: 'Kritis' },
    { komoditas: 'Pisang', lahan: 'Greenhouse 1', berat: 11, tanggalKirim: '2026-10-29', tujuan: 'Pasar Induk, Pasuruan', statusKesegaran: 'Segar' },
    { komoditas: 'Pisang', lahan: 'Lahan A', berat: 90.9, tanggalKirim: '2026-10-26', tujuan: 'Pasar Induk, Mojokerto', statusKesegaran: 'Segar' }
];

$(document).ready(function () {
    const today = new Date().toISOString().split('T')[0];
    $('#tanggal-panen').val(today);

    loadDashboard();
    loadKomoditasOptions();

    $('#form-panen').submit(function (e) {
        e.preventDefault();
        alert('Ini adalah versi statis (GitHub Pages). Data tidak dapat disimpan ke database.');
    });

    $('#form-komoditas').submit(function (e) {
        e.preventDefault();
        alert('Ini adalah versi statis (GitHub Pages). Data tidak dapat disimpan ke database.');
    });
});

function showPage(pageId) {
    $('.page').addClass('hidden').removeClass('block');
    $('#page-' + pageId).removeClass('hidden').addClass('block');

    $('.nav-btn').removeClass('text-emerald-700 bg-emerald-50').addClass('text-slate-500 hover:bg-slate-50 hover:text-emerald-700');
    $('#btn-' + pageId).removeClass('text-slate-500 hover:bg-slate-50 hover:text-emerald-700').addClass('text-emerald-700 bg-emerald-50');

    $('.mobile-nav').removeClass('text-emerald-600').addClass('text-slate-400');
    $('#m-btn-' + pageId).removeClass('text-slate-400').addClass('text-emerald-600');

    if (pageId === 'dashboard') loadDashboard();
    if (pageId === 'input') loadKomoditasOptions();
    if (pageId === 'prioritas') loadPrioritas();
    if (pageId === 'riwayat') loadRiwayat();
    if (pageId === 'komoditas') loadKomoditasOptions();
}

function badgeStatus(status) {
    if (status === 'Kritis') {
        return '<span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700 border border-red-200"><span class="w-1.5 h-1.5 rounded-full bg-red-600 mr-1.5"></span>Kritis</span>';
    } else if (status === 'Cukup') {
        return '<span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>Cukup</span>';
    } else {
        return '<span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200"><span class="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5"></span>Segar</span>';
    }
}

function emptyState(pesan) {
    return `<tr>
        <td colspan="7" class="px-6 py-12 text-center bg-slate-50/50">
            <img src="./assets/images/empty.png" alt="Kosong" class="w-24 h-24 mx-auto mb-3 opacity-60 grayscale" onerror="this.src='https://placehold.co/100x100/e2e8f0/94a3b8?text=Empty'">
            <p class="text-slate-500 text-sm font-medium">${pesan}</p>
        </td>
    </tr>`;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

function loadDashboard() {
    const res = dataDashboardDummy;

    $('#dash-total-berat').text(parseFloat(res.totalBeratGudang || 0).toFixed(1));
    $('#dash-total-batch').text(res.totalBatchGudang);
    
    $('#dash-rekap-segar').text(res.rekapSegar);
    $('#dash-rekap-cukup').text(res.rekapCukup);
    $('#dash-rekap-kritis').text(res.rekapKritis);

    if (res.totalKritis > 0) {
        $('#box-early-warning').removeClass('hidden');
        $('#warning-kritis').text('Perhatian: Terdapat ' + res.totalKritis + ' batch berstatus KRITIS. Segera lakukan distribusi!');
    } else {
        $('#box-early-warning').addClass('hidden');
    }

    let rows = '';
    if (!res.prioritasSingkat || res.prioritasSingkat.length === 0) {
        rows = emptyState("Gudang kosong, belum ada batch aktif.");
    } else {
        res.prioritasSingkat.forEach(function (b) {
            rows += `<tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4 font-bold text-slate-800 text-center">${b.komoditas}</td>
                <td class="px-6 py-4 text-slate-600 font-medium text-center">${b.lahan}</td>
                <td class="px-6 py-4 text-slate-600 text-center">${b.berat} Kg</td>
                <td class="px-6 py-4 font-bold text-slate-800 text-center">${b.sisaUmur} Hari</td>
                <td class="px-6 py-4 text-center">${badgeStatus(b.status)}</td>
            </tr>`;
        });
    }
    $('#tabel-dash-prioritas').html(rows);

    updateCharts(res);
}

function updateCharts(res) {
    if (chartKesegaranInstance) chartKesegaranInstance.destroy();
    const ctxKesegaran = document.getElementById('chartKesegaran').getContext('2d');
    chartKesegaranInstance = new Chart(ctxKesegaran, {
        type: 'doughnut',
        data: {
            labels: ['Segar', 'Cukup', 'Kritis'],
            datasets: [{
                data: [res.rekapSegar, res.rekapCukup, res.rekapKritis],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { 
                    position: 'bottom', 
                    labels: { 
                        usePointStyle: true, 
                        boxWidth: 8, 
                        padding: 20, 
                        font: { family: 'Inter', size: 11 } 
                    }
                }
            }
        }
    });

    if (chartPrioritasInstance) chartPrioritasInstance.destroy();
    const ctxPrioritas = document.getElementById('chartPrioritas').getContext('2d');
    
    const volumeData = res.volumeKomoditas || [];
    const labels = volumeData.map(item => item.komoditas);
    const weights = volumeData.map(item => item.totalBerat);

    const canvasWrapper = document.getElementById('chartPrioritasWrapper');
    if (canvasWrapper) {
        if (labels.length > 5) {
            canvasWrapper.style.width = (labels.length * 80) + 'px';
        } else {
            canvasWrapper.style.width = '100%';
        }
    }

    chartPrioritasInstance = new Chart(ctxPrioritas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Berat (Kg)',
                data: weights,
                backgroundColor: '#059669',
                borderRadius: 6,
                barThickness: 30
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` Total: ${context.raw.toFixed(1)} Kg`;
                        }
                    }
                }
            },
            scales: {
                y: { beginAtZero: true, grid: { display: false } },
                x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11, weight: 'bold' } } }
            }
        }
    });
}

function loadKomoditasOptions() {
    const data = [
        { id: 1, nama: 'Bayam', umur: 3 },
        { id: 2, nama: 'Kangkung', umur: 3 },
        { id: 3, nama: 'Stroberi', umur: 4 },
        { id: 4, nama: 'Jagung Manis', umur: 5 },
        { id: 5, nama: 'Pisang', umur: 6 },
        { id: 6, nama: 'Tomat', umur: 7 },
        { id: 7, nama: 'Cabai', umur: 10 }
    ];

    let optionsHtml = '';
    let tableRows = '';

    for (let i = 0; i < data.length; i++) {
        let k = data[i];
        optionsHtml += `<li class="px-4 py-2 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer" onclick="selectKomoditas(${k.id}, '${k.nama} (${k.umur} Hari)')">${k.nama} (${k.umur} Hari)</li>`;
        tableRows += `<tr class="hover:bg-slate-50 transition-colors">
            <td class="px-6 py-4 font-bold text-slate-800 text-center">${k.nama}</td>
            <td class="px-6 py-4 text-slate-600 font-medium text-center">${k.umur} Hari</td>
        </tr>`;
    }

    $('#dd-komoditas-list').html(optionsHtml);
    $('#tabel-komoditas').html(tableRows);
}

function loadPrioritas() {
    const data = [
        { idBatch: 1, komoditas: 'Bayam', lahan: 'Lahan A', berat: 50.9, tanggalPanen: '2026-11-01', sisaUmur: -1, status: 'Kritis' },
        { idBatch: 2, komoditas: 'Stroberi', lahan: 'Lahan A', berat: 60.4, tanggalPanen: '2026-11-02', sisaUmur: 0, status: 'Kritis' },
        { idBatch: 3, komoditas: 'Tomat', lahan: 'Greenhouse 1', berat: 149, tanggalPanen: '2026-10-30', sisaUmur: 1, status: 'Kritis' },
        { idBatch: 4, komoditas: 'Cabai', lahan: 'Lahan B', berat: 42.9, tanggalPanen: '2026-10-29', sisaUmur: 4, status: 'Segar' }
    ];

    let rows = '';
    data.forEach(function (item) {
        rows += `<tr class="hover:bg-slate-50 transition-colors">
            <td class="px-6 py-4 font-bold text-slate-800 text-center">${item.komoditas}</td>
            <td class="px-6 py-4 text-slate-600 font-medium text-center">${item.lahan}</td>
            <td class="px-6 py-4 text-slate-600 text-center">${item.berat} Kg</td>
            <td class="px-6 py-4 text-slate-600 text-center">${formatDate(item.tanggalPanen)}</td>
            <td class="px-6 py-4 font-bold text-slate-800 text-center">${item.sisaUmur} Hari</td>
            <td class="px-6 py-4 text-center">${badgeStatus(item.status)}</td>
            <td class="px-6 py-4 text-center">
                <button class="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-emerald-700 shadow-sm transition-transform active:scale-95" onclick="alert('Versi statis: Fitur kirim dinonaktifkan')">Kirim</button>
            </td>
        </tr>`;
    });
    $('#tabel-prioritas').html(rows);
}

function loadRiwayat() {
    const bulan = $('#filter-bulan').val();
    const status = $('#filter-status').val();
    const cariTujuan = $('#filter-tujuan').val().toLowerCase();

    let filteredData = dataRiwayatDummy;

    if (bulan) {
        filteredData = filteredData.filter(item => {
            const itemBulan = new Date(item.tanggalKirim).getMonth() + 1;
            return itemBulan === parseInt(bulan);
        });
    }
    if (status) {
        filteredData = filteredData.filter(item => item.statusKesegaran === status);
    }
    if (cariTujuan) {
        filteredData = filteredData.filter(item => item.tujuan.toLowerCase().includes(cariTujuan));
    }

    const totalTerkirim = filteredData.length;
    const kritisTerselamatkan = filteredData.filter(d => d.statusKesegaran === 'Kritis' && d.sisaSaatKirim > 0).length || 3;
    const kritisTidakTerselamatkan = filteredData.filter(d => d.statusKesegaran === 'Kritis' && d.sisaSaatKirim <= 0).length || 3;
    const cukup = filteredData.filter(d => d.statusKesegaran === 'Cukup').length;
    const segar = filteredData.filter(d => d.statusKesegaran === 'Segar').length;

    const rekapHtml = `
        <div class="bg-white border border-slate-100 shadow-sm p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32">
            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Terkirim</p>
            <p class="text-2xl font-extrabold text-slate-800">${totalTerkirim} <span class="text-sm font-medium text-slate-500">Batch</span></p>
        </div>
        <div class="bg-red-50 border border-red-100 shadow-sm p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32">
            <p class="text-[11px] font-bold text-red-500 uppercase tracking-wider mb-1">Kritis Terselamatkan</p>
            <p class="text-2xl font-extrabold text-red-700">${kritisTerselamatkan}</p>
        </div>
        <div class="bg-sky-50 border border-sky-100 shadow-sm p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32">
            <p class="text-[11px] font-bold text-sky-600 uppercase tracking-wider mb-1">Kritis Tidak Terselamatkan</p>
            <p class="text-2xl font-extrabold text-sky-700">${kritisTidakTerselamatkan}</p>
        </div>
        <div class="bg-amber-50 border border-amber-100 shadow-sm p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32">
            <p class="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-1">Status Cukup</p>
            <p class="text-2xl font-extrabold text-amber-700">${cukup}</p>
        </div>
        <div class="bg-emerald-50 border border-emerald-100 shadow-sm p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between h-32">
            <p class="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Status Segar</p>
            <p class="text-2xl font-extrabold text-emerald-700">${segar}</p>
        </div>
    `;
    $('#rekap-riwayat-container').html(rekapHtml);

    let rows = '';
    if (filteredData.length === 0) {
        rows = `<tr><td colspan="6" class="px-6 py-12 text-center bg-slate-50/50">
            <p class="text-slate-500 text-sm font-medium">Belum ada riwayat pengiriman untuk filter ini.</p>
        </td></tr>`;
    } else {
        filteredData.forEach(function (item) {
            rows += `<tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4 font-bold text-slate-800 text-center">${item.komoditas}</td>
                <td class="px-6 py-4 text-slate-600 font-medium text-center">${item.lahan}</td>
                <td class="px-6 py-4 text-slate-600 text-center">${item.berat} Kg</td>
                <td class="px-6 py-4 text-slate-600 text-center">${formatDate(item.tanggalKirim)}</td>
                <td class="px-6 py-4 font-medium text-slate-700 text-center">${item.tujuan}</td>
                <td class="px-6 py-4 text-center">${badgeStatus(item.statusKesegaran)}</td>
            </tr>`;
        });
    }
    $('#tabel-riwayat').html(rows);
}

function toggleKomoditasDropdown() {
    const dropdown = document.getElementById('dd-komoditas');
    dropdown.classList.toggle('hidden');
}

function selectKomoditas(id, text) {
    document.getElementById('komoditas').value = id;
    document.getElementById('dd-komoditas-text').innerText = text;
    document.getElementById('dd-komoditas').classList.add('hidden');
}

function toggleDropdown(id) {
    document.getElementById('dd-bulan').classList.add('hidden');
    document.getElementById('dd-status').classList.add('hidden');
    document.getElementById('dd-komoditas').classList.add('hidden');
    
    const dropdown = document.getElementById(id);
    dropdown.classList.toggle('hidden');
}

function selectDropdown(tipe, value, text) {
    if (tipe === 'bulan') {
        document.getElementById('filter-bulan').value = value;
        document.getElementById('dd-bulan-text').innerText = text;
        document.getElementById('dd-bulan').classList.add('hidden');
    } else if (tipe === 'status') {
        document.getElementById('filter-status').value = value;
        document.getElementById('dd-status-text').innerText = text;
        document.getElementById('dd-status').classList.add('hidden');
    }
    loadRiwayat();
}

window.onclick = function(event) {
    if (!event.target.closest('#dd-bulan-container')) {
        document.getElementById('dd-bulan').classList.add('hidden');
    }
    if (!event.target.closest('#dd-status-container')) {
        document.getElementById('dd-status').classList.add('hidden');
    }
    if (!event.target.closest('#dd-komoditas-container')) {
        document.getElementById('dd-komoditas').classList.add('hidden');
    }
}