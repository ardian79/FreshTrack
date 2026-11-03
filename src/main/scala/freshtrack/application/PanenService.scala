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

  def tambahKomoditas(nama: String, umur: Int): Unit = PanenRepo.simpanKomoditas(nama, umur)
  
  def updateKomoditas(id: Int, nama: String, umur: Int): Unit = PanenRepo.updateKomoditas(id, nama, umur)
  
  def hapusKomoditas(id: Int): Unit = PanenRepo.softDeleteKomoditas(id)

  def ambilKomoditas(): List[Komoditas] = PanenRepo.ambilSemuaKomoditas()

  def tambahPanenBaru(komoditasId: Int, lahan: String, berat: Double, tanggal: LocalDate): Unit = {
    val komoditasOpt = PanenRepo.ambilSemuaKomoditas().find(_.id == komoditasId)
    val umurSimpan = komoditasOpt.map(_.umurSimpanHari).getOrElse(7)
    val sisa = Logic.hitungSisaUmur(tanggal, umurSimpan, LocalDate.now())
    val status = Logic.tentukanStatus(sisa)
    PanenRepo.simpanPanenDanBatch(komoditasId, lahan, berat, tanggal, sisa, status)
  }

  def hapusPanen(idPanen: Int): Unit = PanenRepo.hapusPanen(idPanen)
  
  def updatePanen(idPanen: Int, lahan: String, berat: Double, tanggal: LocalDate): Unit = 
    PanenRepo.updatePanen(idPanen, lahan, berat, tanggal)

  def getDataDashboard(): ujson.Obj = {
    val (semuaBatch, mapPanen) = sinkronisasiBatchHariIni()
    val (aktif, _) = Logic.pisahkanStatusKirim(semuaBatch)
    val totalBerat = Logic.hitungTotalBerat(aktif, mapPanen)
    val jumlahKritis = Logic.filterBatchKritis(aktif).size
    val rekap = Logic.rekapStatus(aktif)
    val top3 = Logic.ambilPrioritasUtama(aktif, 3)

    val top3Json = top3.flatMap { b =>
      mapPanen.get(b.idPanen).map { p =>
        ujson.Obj(
          "idBatch" -> b.id,
          "idPanen" -> p.id,
          "komoditas" -> p.komoditas,
          "lahan" -> p.lahan,
          "berat" -> p.beratKg,
          "sisaUmur" -> b.sisaUmurHari,
          "status" -> b.status.toString
        )
      }
    }

    val semuaKomoditas = PanenRepo.ambilSemuaKomoditas()

    val beratAktifMap = aktif
      .flatMap { b =>
        mapPanen.get(b.idPanen).map(p => (p.komoditas, p.beratKg))
      }
      .groupBy(_._1)
      .view.mapValues(_.map(_._2).sum).toMap

    val volumeKomoditasMap = semuaKomoditas.map { k =>
      val totalBerat = beratAktifMap.getOrElse(k.nama, 0.0)
      (k.nama, totalBerat)
    }.sortBy(_._1)

    val volumeKomoditasJson = volumeKomoditasMap.map { case (nama, berat) =>
      ujson.Obj("komoditas" -> nama, "totalBerat" -> berat)
    }

    ujson.Obj(
      "totalBatchGudang" -> aktif.size,
      "totalBeratGudang" -> totalBerat,
      "totalKritis" -> jumlahKritis,
      "rekapSegar" -> rekap.getOrElse(StatusKesegaran.Segar, 0),
      "rekapCukup" -> rekap.getOrElse(StatusKesegaran.Cukup, 0),
      "rekapKritis" -> rekap.getOrElse(StatusKesegaran.Kritis, 0),
      "prioritasSingkat" -> ujson.Arr.from(top3Json),
      "volumeKomoditas" -> ujson.Arr.from(volumeKomoditasJson)
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
    val (semuaBatch, mapPanen) = sinkronisasiBatchHariIni()
    semuaBatch.find(_.id == idBatch) match {
      case None => Left("Batch tidak ditemukan.")
      case Some(batch) =>
        Logic.validasiPengiriman(batch).flatMap { validBatch =>
          val panenOpt = mapPanen.get(validBatch.idPanen)
          val statusKirim = panenOpt.map { p =>
            val sisa = Logic.hitungSisaUmur(p.tanggalPanen, p.umurSimpanHari, tanggalKirim)
            Logic.tentukanStatus(sisa).toString
          }.getOrElse(validBatch.status.toString)

          val berhasil = PanenRepo.catatPengiriman(validBatch.id, tanggalKirim, tujuan, statusKirim)
          if berhasil then Right(validBatch) else Left("Gagal menyimpan pengiriman.")
        }
    }
  }

  def getRiwayatDanRekap(filterBulan: Option[Int], filterStatus: Option[String], filterTujuan: Option[String]): ujson.Obj = {
    val (semuaBatch, mapPanen) = sinkronisasiBatchHariIni()
    val mapBatch = semuaBatch.map(b => b.id -> b).toMap
    val semuaPengiriman = PanenRepo.ambilSemuaPengiriman()
    val hasilTelusur = Logic.telusuriRiwayat(semuaPengiriman, filterBulan)

    val riwayatTerfilter = hasilTelusur.flatMap { kirim =>
      mapBatch.get(kirim.idBatch).flatMap { b =>
        mapPanen.get(b.idPanen).map { p =>
          val sisaKirim = Logic.hitungSisaUmur(p.tanggalPanen, p.umurSimpanHari, kirim.tanggalKirim)
          val statusAktif = StatusKesegaran.values.find(_.toString.equalsIgnoreCase(kirim.statusKirim)).getOrElse(Logic.tentukanStatus(sisaKirim))
          
          val cocokStatus = filterStatus match {
            case None | Some("") => true
            case Some(st)        => statusAktif.toString.equalsIgnoreCase(st.trim)
          }
          
          val cocokTujuan = filterTujuan match {
            case None | Some("") => true
            case Some(tj)        => kirim.tujuan.toLowerCase.contains(tj.trim.toLowerCase)
          }

          if (cocokStatus && cocokTujuan) then Some((kirim, b, p, statusAktif, sisaKirim)) else None
        }.flatten
      }
    }

    val batchTerkirim = riwayatTerfilter.map(_._2)
    val totalBeratTerkirim = Logic.hitungTotalBerat(batchTerkirim, mapPanen)

    val kritis = riwayatTerfilter.count { case (_, _, _, stat, _) => stat == StatusKesegaran.Kritis }
    val cukup = riwayatTerfilter.count { case (_, _, _, stat, _) => stat == StatusKesegaran.Cukup }
    val segar = riwayatTerfilter.count { case (_, _, _, stat, _) => stat == StatusKesegaran.Segar }

    val jsonRiwayat = riwayatTerfilter.map { case (kirim, b, p, stat, _) =>
      ujson.Obj(
        "idPengiriman" -> kirim.id,
        "idBatch" -> b.id,
        "komoditas" -> p.komoditas,
        "lahan" -> p.lahan,
        "berat" -> p.beratKg,
        "tanggalKirim" -> kirim.tanggalKirim.toString,
        "tujuan" -> kirim.tujuan,
        "statusKesegaran" -> stat.toString
      )
    }

    ujson.Obj(
      "totalBatchTerkirim" -> batchTerkirim.size,
      "totalBeratTerkirim" -> totalBeratTerkirim,
      "statusKritis" -> kritis,
      "diselamatkanCukup" -> cukup,
      "diselamatkanSegar" -> segar,
      "riwayat" -> ujson.Arr.from(jsonRiwayat)
    )
  }
}