let chartKesegaranInstance = null;
let chartPrioritasInstance = null;

$(document).ready(function () {
    const today = new Date().toISOString().split('T')[0];
    $('#tanggal-panen').val(today);

    loadDashboard();
    loadKomoditasOptions();

    $('#form-panen').submit(function (e) {
        e.preventDefault();
        
        const komoditasId = $('#komoditas').val();
        if (!komoditasId) {
            alert('Silakan pilih komoditas terlebih dahulu.');
            return;
        }

        const beratVal = parseFloat($('#berat').val());
        if (isNaN(beratVal) || beratVal <= 0) {
            alert('Berat harus lebih dari 0 Kg.');
            return;
        }
        const data = {
            komoditasId: parseInt(komoditasId),
            lahan: $('#lahan').val(),
            berat: beratVal,
            tanggal: $('#tanggal-panen').val()
        };
        $.ajax({
            url: '/api/panen',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function () {
                $('#form-panen')[0].reset();
                document.getElementById('dd-komoditas-text').innerText = '-- Pilih Komoditas --';
                $('#tanggal-panen').val(today);
                showPage('prioritas');
            }
        });
    });

    $('#form-komoditas').submit(function (e) {
        e.preventDefault();
        const umurVal = parseInt($('#umur-komoditas').val());
        if (isNaN(umurVal) || umurVal <= 0) {
            alert('Umur simpan harus minimal 1 hari.');
            return;
        }
        const data = {
            nama: $('#nama-komoditas').val(),
            umur: umurVal
        };
        $.ajax({
            url: '/api/komoditas',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function () {
                $('#form-komoditas')[0].reset();
                loadKomoditasOptions();
            }
        });
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
            <img src="/public/assets/images/empty.png" alt="Kosong" class="w-24 h-24 mx-auto mb-3 opacity-60 grayscale" onerror="this.src='https://placehold.co/100x100/e2e8f0/94a3b8?text=Empty'">
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
    $.getJSON('/api/dashboard', function (res) {
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
    });
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
    const formatLabel = (label) => {
        if (label.length <= 15) return label;
        const words = label.split(' ');
        let lines = [];
        let currentLine = words[0];
        for (let i = 1; i < words.length; i++) {
            if (currentLine.length + words[i].length + 1 <= 15) {
                currentLine += ' ' + words[i];
            } else {
                lines.push(currentLine);
                currentLine = words[i];
            }
        }
        lines.push(currentLine);
        return lines;
    };

    const rawLabels = volumeData.map(item => item.komoditas);
    const labels = rawLabels.map(formatLabel);
    const weights = volumeData.map(item => item.totalBerat);

    const canvasWrapper = document.getElementById('chartPrioritasWrapper');
    const canvasEl = document.getElementById('chartPrioritas');
    
    if (canvasWrapper && canvasEl) {
        const finalWidth = Math.max(rawLabels.length * 110, 600);
        canvasWrapper.style.width = finalWidth + 'px';
        canvasEl.style.width = finalWidth + 'px';
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
                barThickness: 32
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return rawLabels[context[0].dataIndex];
                        },
                        label: function(context) {
                            return ` Total: ${context.raw.toFixed(1)} Kg`;
                        }
                    }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    grid: { display: false }
                },
                x: {
                    grid: { display: false },
                    ticks: { 
                        font: { family: 'Inter', size: 11, weight: 'bold' },
                        maxRotation: 0,
                        minRotation: 0,
                        autoSkip: false,
                        padding: 8
                    }
                }
            }
        }
    });
}

function loadKomoditasOptions() {
    $.getJSON('/api/komoditas', function (data) {
        let optionsHtml = '';
        let tableRows = '';

        for (let i = 0; i < data.length; i++) {
            let k = data[i];
            optionsHtml += `<li class="px-4 py-2 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer" onclick="selectKomoditas(${k.id}, '${k.nama} (${k.umur} Hari)')">${k.nama} (${k.umur} Hari)</li>`;
            
            tableRows += `<tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4 font-bold text-slate-800 text-center">${k.nama}</td>
                <td class="px-6 py-4 text-slate-600 font-medium text-center">${k.umur} Hari</td>
                <td class="px-6 py-4 text-center whitespace-nowrap">
                    <!-- BAGIAN YANG DIUBAH DIMULAI DI SINI -->
                    <div class="flex items-center justify-center gap-2">
                        <button class="w-9 h-9 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-all flex items-center justify-center" onclick="editKomoditas(${k.id}, '${k.nama}', ${k.umur})" title="Edit">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button class="w-9 h-9 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-all flex items-center justify-center" onclick="hapusKomoditas(${k.id})" title="Hapus">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                    <!-- BAGIAN YANG DIUBAH SELESAI -->
                </td>
            </tr>`;
        }

        $('#dd-komoditas-list').html(optionsHtml);
        $('#tabel-komoditas').html(tableRows);
    });
}

function loadPrioritas() {
    $.getJSON('/api/prioritas', function (data) {
        let rows = '';
        if (data.length === 0) {
            rows = emptyState("Seluruh komoditas telah terdistribusi dengan baik.");
        } else {
            data.forEach(function (item) {
                rows += `<tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4 font-bold text-slate-800 text-center">${item.komoditas}</td>
                    <td class="px-6 py-4 text-slate-600 font-medium text-center">${item.lahan}</td>
                    <td class="px-6 py-4 text-slate-600 text-center">${item.berat} Kg</td>
                    <td class="px-6 py-4 text-slate-600 text-center">${formatDate(item.tanggalPanen)}</td>
                    <td class="px-6 py-4 font-bold text-slate-800 text-center">${item.sisaUmur} Hari</td>
                    <td class="px-6 py-4 text-center">${badgeStatus(item.status)}</td>
                    <td class="px-6 py-4 text-center whitespace-nowrap">
                        <!-- BAGIAN YANG DIUBAH DIMULAI DI SINI -->
                        <div class="flex items-center justify-center gap-2">
                            <button class="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center whitespace-nowrap active:scale-95" onclick="kirimBarang(${item.idBatch}, '${item.komoditas.replace(/'/g, "\\'")}')">
                                Kirim
                            </button>
                            <button class="w-9 h-9 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-all flex items-center justify-center" onclick="editPrioritas(${item.idPanen}, '${item.lahan}', ${item.berat})" title="Edit">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                            </button>
                            <button class="w-9 h-9 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-all flex items-center justify-center" onclick="hapusPrioritas(${item.idPanen})" title="Hapus">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                            </button>
                        </div>
                        <!-- BAGIAN YANG DIUBAH SELESAI -->
                    </td>
                </tr>`;
            });
        }
        $('#tabel-prioritas').html(rows);
    });
}

function kirimBarang(idBatch, namaKomoditas) {
    $('#modal-id-batch').val(idBatch);
    $('#modal-komoditas-teks').text('Kirim ' + namaKomoditas + ' ke:');
    $('#modal-tujuan').val('');
    $('#modal-kirim').removeClass('hidden');
    setTimeout(function() { $('#modal-tujuan').focus(); }, 100);
}

function tutupModal() {
    $('#modal-kirim').addClass('hidden');
}

function konfirmasiKirim() {
    const idBatch = $('#modal-id-batch').val();
    const tujuan = $('#modal-tujuan').val().trim();

    if (!tujuan) {
        alert("Lokasi tujuan wajib diisi!");
        $('#modal-tujuan').focus();
        return;
    }

    const tanggalKirim = new Date().toISOString().split('T')[0];

    $.ajax({
        url: '/api/kirim',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            idBatch: parseInt(idBatch),
            tujuan: tujuan,
            tanggalKirim: tanggalKirim
        }),
        success: function () {
            tutupModal();
            loadPrioritas();
            loadDashboard();
        },
        error: function (xhr) {
            alert('Gagal: ' + (xhr.responseJSON ? xhr.responseJSON.pesan : 'Terjadi kesalahan sistem'));
        }
    });
}

function loadRiwayat() {
    const bulan = $('#filter-bulan').val();
    const status = $('#filter-status').val();
    const tujuan = $('#filter-tujuan').val();

    const params = {};
    if (bulan) params.bulan = parseInt(bulan);
    if (status) params.status = status;
    if (tujuan) params.tujuan = tujuan;

    $.getJSON('/api/riwayat', params, function (res) {
            const rekapHtml = `
            <div class="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl relative overflow-hidden">
                <p class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Terkirim</p>
                <p class="text-3xl md:text-4xl font-extrabold text-slate-800">${res.totalBatchTerkirim} <span class="text-sm font-medium text-slate-500">Batch</span></p>
            </div>
            <div class="bg-red-50 border border-red-200 shadow-sm p-5 rounded-2xl relative overflow-hidden">
                <p class="text-sm font-bold text-red-600 uppercase tracking-wider mb-2">Status Kritis</p>
                <p class="text-3xl md:text-4xl font-extrabold text-red-700">${res.statusKritis || res.diselamatkanKritis || 0}</p>
            </div>
            <div class="bg-amber-50 border border-amber-200 shadow-sm p-5 rounded-2xl relative overflow-hidden">
                <p class="text-sm font-bold text-amber-600 uppercase tracking-wider mb-2">Status Cukup</p>
                <p class="text-3xl md:text-4xl font-extrabold text-amber-700">${res.diselamatkanCukup || 0}</p>
            </div>
            <div class="bg-emerald-50 border border-emerald-200 shadow-sm p-5 rounded-2xl relative overflow-hidden">
                <p class="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-2">Status Segar</p>
                <p class="text-3xl md:text-4xl font-extrabold text-emerald-700">${res.diselamatkanSegar || 0}</p>
            </div>
        `;
        $('#rekap-riwayat-container').html(rekapHtml);
        let rows = '';
        if (res.riwayat.length === 0) {
            rows = `<tr><td colspan="6" class="px-6 py-12 text-center bg-slate-50/50">
                <p class="text-slate-500 text-sm font-medium">Belum ada riwayat pengiriman untuk filter ini.</p>
            </td></tr>`;
        } else {
            res.riwayat.forEach(function (item) {
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
    });
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

function editPrioritas(idPanen, lahan, berat) {
    $('#edit-id-panen').val(idPanen);
    $('#edit-lahan').val(lahan);
    $('#edit-berat').val(berat);
    $('#modal-edit-prioritas').removeClass('hidden');
}

function simpanEditPrioritas() {
    const idPanen = $('#edit-id-panen').val();
    const lahan = $('#edit-lahan').val();
    const berat = parseFloat($('#edit-berat').val());

    if (!lahan || isNaN(berat) || berat <= 0) {
        alert('Pastikan lahan terisi dan berat lebih dari 0.');
        return;
    }

    $.ajax({
        url: '/api/panen/update',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ idPanen: parseInt(idPanen), lahan: lahan, berat: berat }),
        success: function () {
            $('#modal-edit-prioritas').addClass('hidden');
            loadPrioritas();
            loadDashboard();
        }
    });
}

function hapusPrioritas(idPanen) {
    if (confirm('Apakah Anda yakin ingin menghapus data panen ini?')) {
        $.ajax({
            url: '/api/panen/delete/' + idPanen,
            type: 'POST',
            success: function () {
                loadPrioritas();
                loadDashboard();
            }
        });
    }
}

function editKomoditas(id, nama, umur) {
    $('#edit-id-komoditas').val(id);
    $('#edit-nama-komoditas').val(nama);
    $('#edit-umur-komoditas').val(umur);
    $('#modal-edit-komoditas').removeClass('hidden');
}

function simpanEditKomoditas() {
    const id = $('#edit-id-komoditas').val();
    const nama = $('#edit-nama-komoditas').val();
    const umur = parseInt($('#edit-umur-komoditas').val());

    if (!nama || isNaN(umur) || umur <= 0) {
        alert('Pastikan nama terisi dan umur minimal 1 hari.');
        return;
    }

    $.ajax({
        url: '/api/komoditas/update',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ id: parseInt(id), nama: nama, umur: umur }),
        success: function () {
            $('#modal-edit-komoditas').addClass('hidden');
            loadKomoditasOptions();
        }
    });
}

function hapusKomoditas(id) {
    if (confirm('Apakah Anda yakin ingin menghapus komoditas ini?')) {
        $.ajax({
            url: '/api/komoditas/delete/' + id,
            type: 'POST',
            success: function () {
                loadKomoditasOptions();
            }
        });
    }
}