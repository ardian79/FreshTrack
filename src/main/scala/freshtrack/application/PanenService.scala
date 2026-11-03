package freshtrack.application

import java.time.LocalDate
import freshtrack.domain.*
import freshtrack.infrastructure.PanenRepo

object PanenService {

  def sinkronisasiBatchHariIni(): (List[Batch], Map[Int, Panen]) = {
    val daftarPanen = PanenRepo.ambilSemuaPanen()
    val daftarBatchDb = PanenRepo.ambilSemuaBatch()
    val mapPanen = daftarPanen.map(p => p.id -> p).toMap
    val hariIni = LocalDate.now()

    val batchTersinkron = daftarBatchDb.flatMap { b =>
      mapPanen.get(b.idPanen).map { p =>
        Logic.buatBatch(b.id, p, p.umurSimpanHari, hariIni, b.sudahDikirim)
      }
    }
    (batchTersinkron, mapPanen)
  }

  def tambahKomoditas(nama: String, umur: Int): Unit =
    PanenRepo.simpanKomoditas(nama, umur)

  def ambilKomoditas(): List[Komoditas] =
    PanenRepo.ambilSemuaKomoditas()

  def tambahPanenBaru(komoditasId: Int, lahan: String, berat: Double, tanggal: LocalDate): Unit = {
    val komoditasOpt = PanenRepo.ambilSemuaKomoditas().find(_.id == komoditasId)
    val umurSimpan = komoditasOpt.map(_.umurSimpanHari).getOrElse(7)
    val sisa = Logic.hitungSisaUmur(tanggal, umurSimpan, LocalDate.now())
    val status = Logic.tentukanStatus(sisa)
    PanenRepo.simpanPanenDanBatch(komoditasId, lahan, berat, tanggal, sisa, status)
  }

  def getDataDashboard(): ujson.Obj = {
    val (semuaBatch, mapPanen) = sinkronisasiBatchHariIni()
    val (aktif, _) = Logic.pisahkanStatusKirim(semuaBatch)
    val totalBerat = Logic.hitungTotalBerat(aktif, mapPanen)
    val jumlahKritis = Logic.filterBatchKritis(aktif).size
    val rekap = Logic.rekapStatus(aktif)
    val top3 = Logic.ambilPrioritasUtama(aktif, 3)
    val tertuaOpt = Logic.cariBatchTertua(aktif)

    val top3Json = top3.flatMap { b =>
      mapPanen.get(b.idPanen).map { p =>
        ujson.Obj(
          "idBatch" -> b.id,
          "komoditas" -> p.komoditas,
          "lahan" -> p.lahan,
          "berat" -> p.beratKg,
          "sisaUmur" -> b.sisaUmurHari,
          "status" -> b.status.toString
        )
      }
    }

    ujson.Obj(
      "totalBatchGudang" -> aktif.size,
      "totalBeratGudang" -> totalBerat,
      "totalKritis" -> jumlahKritis,
      "rekapSegar" -> rekap.getOrElse(StatusKesegaran.Segar, 0),
      "rekapCukup" -> rekap.getOrElse(StatusKesegaran.Cukup, 0),
      "rekapKritis" -> rekap.getOrElse(StatusKesegaran.Kritis, 0),
      "batchTertuaId" -> tertuaOpt.map(_.id).getOrElse(0),
      "prioritasSingkat" -> ujson.Arr.from(top3Json)
    )
  }

  def getDaftarPrioritas(): ujson.Arr = {
    val (semuaBatch, mapPanen) = sinkronisasiBatchHariIni()
    val terurut = Logic.urutkanPrioritas(semuaBatch)
    val listJson = Logic.prosesSemuaBatch(terurut) { b =>
      val p = mapPanen(b.idPanen)
      ujson.Obj(
        "idBatch" -> b.id,
        "idPanen" -> p.id,
        "komoditas" -> p.komoditas,
        "lahan" -> p.lahan,
        "berat" -> p.beratKg,
        "tanggalPanen" -> p.tanggalPanen.toString,
        "sisaUmur" -> b.sisaUmurHari,
        "status" -> b.status.toString
      )
    }
    ujson.Arr.from(listJson)
  }

  def eksekusiPengiriman(idBatch: Int, tujuan: String, tanggalKirim: LocalDate): Either[String, Batch] = {
    val (semuaBatch, _) = sinkronisasiBatchHariIni()
    semuaBatch.find(_.id == idBatch) match {
      case None => Left("Batch tidak ditemukan.")
      case Some(batch) =>
        Logic.validasiPengiriman(batch).flatMap { validBatch =>
          val berhasil = PanenRepo.catatPengiriman(validBatch.id, tanggalKirim, tujuan)
          if berhasil then Right(validBatch) else Left("Gagal menyimpan pengiriman.")
        }
    }
  }

  def getRiwayatDanRekap(filterBulan: Option[Int], filterStatus: Option[String]): ujson.Obj = {
    val (semuaBatch, mapPanen) = sinkronisasiBatchHariIni()
    val mapBatch = semuaBatch.map(b => b.id -> b).toMap
    val semuaPengiriman = PanenRepo.ambilSemuaPengiriman()
    val hasilTelusur = Logic.telusuriRiwayat(semuaPengiriman, filterBulan)

    val riwayatTerfilter = hasilTelusur.flatMap { kirim =>
      mapBatch.get(kirim.idBatch).flatMap { b =>
        val cocokStatus = filterStatus match {
          case None | Some("") => true
          case Some(st)        => b.status.toString.equalsIgnoreCase(st)
        }
        if cocokStatus then mapPanen.get(b.idPanen).map(p => (kirim, b, p))
        else None
      }
    }

    val batchTerkirim = riwayatTerfilter.map(_._2)
    val totalBeratTerkirim = Logic.hitungTotalBerat(batchTerkirim, mapPanen)
    val rekapTerkirim = Logic.rekapStatus(batchTerkirim)

    val jsonRiwayat = riwayatTerfilter.map { (kirim, b, p) =>
      ujson.Obj(
        "idPengiriman" -> kirim.id,
        "idBatch" -> b.id,
        "komoditas" -> p.komoditas,
        "lahan" -> p.lahan,
        "berat" -> p.beratKg,
        "tanggalKirim" -> kirim.tanggalKirim.toString,
        "tujuan" -> kirim.tujuan,
        "statusKesegaran" -> b.status.toString
      )
    }

    ujson.Obj(
      "totalBatchTerkirim" -> batchTerkirim.size,
      "totalBeratTerkirim" -> totalBeratTerkirim,
      "diselamatkanKritis" -> rekapTerkirim.getOrElse(StatusKesegaran.Kritis, 0),
      "diselamatkanCukup" -> rekapTerkirim.getOrElse(StatusKesegaran.Cukup, 0),
      "diselamatkanSegar" -> rekapTerkirim.getOrElse(StatusKesegaran.Segar, 0),
      "riwayat" -> ujson.Arr.from(jsonRiwayat)
    )
  }
}