package freshtrack.domain

import java.time.LocalDate

enum StatusKesegaran:
  case Segar, Cukup, Kritis

case class Komoditas(
    id: Int,
    nama: String,
    umurSimpanHari: Int,
    isDeleted: Boolean = false
)

case class Panen(
    id: Int,
    komoditasId: Int,
    komoditas: String,
    umurSimpanHari: Int,
    lahan: String,
    beratKg: Double,
    tanggalPanen: LocalDate
)

case class Batch(
    id: Int,
    idPanen: Int,
    sisaUmurHari: Int,
    status: StatusKesegaran,
    sudahDikirim: Boolean = false
)

case class Pengiriman(
    id: Int,
    idBatch: Int,
    tanggalKirim: LocalDate,
    tujuan: String,
    statusKirim: String
)