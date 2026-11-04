package freshtrack.domain

import java.time.LocalDate
import java.time.temporal.ChronoUnit
import scala.annotation.tailrec
import StatusKesegaran.*

object Logic {

  val aturanStandar: Int => StatusKesegaran = (sisa: Int) =>
    if sisa <= 1 then Kritis
    else if sisa <= 3 then Cukup
    else Segar

  val aturanSensitif: Int => StatusKesegaran = (sisa: Int) =>
    if sisa <= 1 then Kritis
    else if sisa == 2 then Cukup
    else Segar

  val aturanStatusMap: Map[String, Int => StatusKesegaran] = Map(
    "Bayam"    -> aturanSensitif,
    "Kangkung" -> aturanSensitif,
    "Default"  -> aturanStandar
  )

  def hitungSisaUmur(tanggalPanen: LocalDate, umurSimpan: Int, hariIni: LocalDate): Int = {
    val selisih = ChronoUnit.DAYS.between(tanggalPanen, hariIni).toInt
    val sisa = umurSimpan - selisih
    if (sisa < 0) 0 else sisa
  }

  def tentukanStatus(sisaUmur: Int): StatusKesegaran =
    aturanStandar(sisaUmur)

  def buatBatch(idBatch: Int, panen: Panen, umurSimpan: Int, hariIni: LocalDate, sudahDikirim: Boolean = false): Batch = {
    val fungsiHitungSisa: Int => Int = (batasUmur: Int) =>
      hitungSisaUmur(panen.tanggalPanen, batasUmur, hariIni)

    val aturanTerpilih = aturanStatusMap.getOrElse(panen.komoditas, aturanStatusMap("Default"))

    val fungsiKomposisiStatus: Int => StatusKesegaran =
      fungsiHitungSisa.andThen(aturanTerpilih)

    val sisaHari = fungsiHitungSisa(umurSimpan)
    
    val statusBatch = fungsiKomposisiStatus(umurSimpan)

    Batch(
      id = idBatch,
      idPanen = panen.id,
      sisaUmurHari = sisaHari,
      status = statusBatch,
      sudahDikirim = sudahDikirim
    )
  }

  def urutkanPrioritas(batches: List[Batch]): List[Batch] = {
    val bobotUrgensi = Map(Kritis -> 1, Cukup -> 2, Segar -> 3)
    batches
      .filter(b => !b.sudahDikirim)
      .sortBy(b => (bobotUrgensi(b.status), b.sisaUmurHari))
  }

  def validasiPengiriman(batch: Batch): Either[String, Batch] =
    if batch.sudahDikirim then
      Left("Batch sudah pernah dikirim sebelumnya.")
    else
      Right(batch)

  def rekapStatus(batches: List[Batch]): Map[StatusKesegaran, Int] =
    batches
      .groupBy(b => b.status)
      .map((status, daftar) => (status, daftar.size))

  def hitungTotalBerat(batches: List[Batch], mapPanen: Map[Int, Panen]): Double =
    batches.foldLeft(0.0) { (total, batch) =>
      val berat = mapPanen.get(batch.idPanen).map(_.beratKg).getOrElse(0.0)
      total + berat
    }

  def filterBatchKritis(batches: List[Batch]): List[Batch] =
    batches.filter(b => !b.sudahDikirim && b.status == Kritis)

  def prosesSemuaBatch[A](batches: List[Batch])(f: Batch => A): List[A] =
    batches.map(b => f(b))

  def ambilPrioritasUtama(batches: List[Batch], jumlah: Int): List[Batch] =
    batches
      .filter(b => !b.sudahDikirim)
      .sortBy(b => b.sisaUmurHari)
      .take(jumlah)

  def pisahkanStatusKirim(batches: List[Batch]): (List[Batch], List[Batch]) =
    batches.partition(b => !b.sudahDikirim)

  @tailrec
  def telusuriRiwayat(
      daftarPengiriman: List[Pengiriman],
      filterBulan: Option[Int],
      akumulator: List[Pengiriman] = Nil
  ): List[Pengiriman] =
    daftarPengiriman match {
      case Nil => akumulator.reverse
      case head :: tail =>
        val cocok = filterBulan match {
          case None        => true
          case Some(bulan) => head.tanggalKirim.getMonthValue == bulan
        }
        if cocok then telusuriRiwayat(tail, filterBulan, head :: akumulator)
        else telusuriRiwayat(tail, filterBulan, akumulator)
    }

  def cariBatchTertua(batches: List[Batch]): Option[Batch] = {
    val aktif = batches.filter(b => !b.sudahDikirim)

    @tailrec
    def telusuri(sisa: List[Batch], kandidat: Batch): Batch =
      sisa match {
        case Nil => kandidat
        case head :: tail =>
          val terpilih = if head.sisaUmurHari < kandidat.sisaUmurHari then head else kandidat
          telusuri(tail, terpilih)
      }

    aktif match {
      case Nil          => None
      case head :: tail => Some(telusuri(tail, head))
    }
  }
}