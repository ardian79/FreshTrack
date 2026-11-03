package freshtrack.web

import java.time.LocalDate
import freshtrack.application.PanenService

object Routes extends cask.Routes {

  @cask.get("/")
  def root() = cask.Redirect("/public/index.html")

  @cask.get("/api/dashboard")
  def getDashboard() = {
    val res = PanenService.getDataDashboard()
    cask.Response(res.render(), headers = Seq("Content-Type" -> "application/json"))
  }

  @cask.get("/api/komoditas")
  def getKomoditas() = {
    val list = PanenService.ambilKomoditas()
    val jsonArr = list.map { k =>
      ujson.Obj("id" -> k.id, "nama" -> k.nama, "umur" -> k.umurSimpanHari)
    }
    cask.Response(ujson.Arr.from(jsonArr).render(), headers = Seq("Content-Type" -> "application/json"))
  }

  @cask.postJson("/api/komoditas")
  def postKomoditas(nama: String, umur: Int) = {
    PanenService.tambahKomoditas(nama, umur)
    cask.Response(ujson.Obj("status" -> "sukses").render(), headers = Seq("Content-Type" -> "application/json"))
  }

  @cask.postJson("/api/komoditas/update")
  def updateKomoditas(id: Int, nama: String, umur: Int) = {
    PanenService.updateKomoditas(id, nama, umur)
    cask.Response(ujson.Obj("status" -> "sukses").render(), headers = Seq("Content-Type" -> "application/json"))
  }

  @cask.post("/api/komoditas/delete/:id")
  def deleteKomoditas(id: Int) = {
    PanenService.hapusKomoditas(id)
    cask.Response(ujson.Obj("status" -> "sukses").render(), headers = Seq("Content-Type" -> "application/json"))
  }

  @cask.postJson("/api/panen")
  def postPanen(komoditasId: Int, lahan: String, berat: Double, tanggal: String) = {
    val tgl = if tanggal.nonEmpty then LocalDate.parse(tanggal) else LocalDate.now()
    PanenService.tambahPanenBaru(komoditasId, lahan, berat, tgl)
    cask.Response(ujson.Obj("status" -> "sukses").render(), headers = Seq("Content-Type" -> "application/json"))
  }

  @cask.postJson("/api/panen/update")
  def updatePanen(idPanen: Int, lahan: String, berat: Double) = {
    PanenService.updatePanen(idPanen, lahan, berat)
    cask.Response(ujson.Obj("status" -> "sukses").render(), headers = Seq("Content-Type" -> "application/json"))
  }

  @cask.post("/api/panen/delete/:id")
  def deletePanen(id: Int) = {
    PanenService.hapusPanen(id)
    cask.Response(ujson.Obj("status" -> "sukses").render(), headers = Seq("Content-Type" -> "application/json"))
  }

  @cask.get("/api/prioritas")
  def getPrioritas() = {
    val jsonArr = PanenService.getDaftarPrioritas()
    cask.Response(jsonArr.render(), headers = Seq("Content-Type" -> "application/json"))
  }

  @cask.postJson("/api/kirim")
  def postKirim(idBatch: Int, tujuan: String, tanggalKirim: String) = {
    val tgl = if tanggalKirim.nonEmpty then LocalDate.parse(tanggalKirim) else LocalDate.now()
    PanenService.eksekusiPengiriman(idBatch, tujuan, tgl) match {
      case Right(_) =>
        cask.Response(ujson.Obj("status" -> "sukses").render(), headers = Seq("Content-Type" -> "application/json"))
      case Left(pesan) =>
        cask.Response(ujson.Obj("status" -> "gagal", "pesan" -> pesan).render(), statusCode = 400, headers = Seq("Content-Type" -> "application/json"))
    }
  }

  @cask.get("/api/riwayat")
  def getRiwayat(bulan: Option[Int] = None, status: Option[String] = None, tujuan: Option[String] = None) = {
    val res = PanenService.getRiwayatDanRekap(bulan, status, tujuan)
    cask.Response(res.render(), headers = Seq("Content-Type" -> "application/json"))
  }

  @cask.staticResources("/public")
  def staticFileRoutes() = "public"

  initialize()
}