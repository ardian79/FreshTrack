package freshtrack

import java.time.LocalDate

object Routes extends cask.Routes {

  // Root Redirect
  @cask.get("/")
  def root() = cask.Redirect("/public/index.html")

  // Dashboard
  @cask.get("/api/dashboard")
  def getDashboard() = {
    val res = Service.getDataDashboard()
    cask.Response(res.render(), headers = Seq("Content-Type" -> "application/json"))
  }

  // Komoditas
  @cask.get("/api/komoditas")
  def getKomoditas() = {
    val list = Service.ambilKomoditas()
    val jsonArr = list.map { k =>
      ujson.Obj("id" -> k.id, "nama" -> k.nama, "umur" -> k.umurSimpanHari)
    }
    cask.Response(ujson.Arr.from(jsonArr).render(), headers = Seq("Content-Type" -> "application/json"))
  }

  @cask.postJson("/api/komoditas")
  def postKomoditas(nama: String, umur: Int) = {
    Service.tambahKomoditas(nama, umur)
    cask.Response(ujson.Obj("status" -> "sukses").render(), headers = Seq("Content-Type" -> "application/json"))
  }

  @cask.postJson("/api/komoditas/update")
  def updateKomoditas(id: Int, nama: String, umur: Int) = {
    Service.updateKomoditas(id, nama, umur)
    cask.Response(ujson.Obj("status" -> "sukses").render(), headers = Seq("Content-Type" -> "application/json"))
  }

  @cask.post("/api/komoditas/delete/:id")
  def deleteKomoditas(id: Int) = {
    Service.hapusKomoditas(id)
    cask.Response(ujson.Obj("status" -> "sukses").render(), headers = Seq("Content-Type" -> "application/json"))
  }

  // Panen
  @cask.postJson("/api/panen")
  def postPanen(komoditasId: Int, lahan: String, berat: Double, tanggal: String) = {
    val tgl = if tanggal.nonEmpty then LocalDate.parse(tanggal) else LocalDate.now()
    Service.tambahPanenBaru(komoditasId, lahan, berat, tgl)
    cask.Response(ujson.Obj("status" -> "sukses").render(), headers = Seq("Content-Type" -> "application/json"))
  }

  @cask.postJson("/api/panen/update")
  def updatePanen(idPanen: Int, lahan: String, berat: Double, tanggal: String) = {
    val tgl = if tanggal.nonEmpty then LocalDate.parse(tanggal) else LocalDate.now()
    Service.updatePanen(idPanen, lahan, berat, tgl)
    cask.Response(ujson.Obj("status" -> "sukses").render(), headers = Seq("Content-Type" -> "application/json"))
  }

  @cask.post("/api/panen/delete/:id")
  def deletePanen(id: Int) = {
    Service.hapusPanen(id)
    cask.Response(ujson.Obj("status" -> "sukses").render(), headers = Seq("Content-Type" -> "application/json"))
  }

  // Prioritas
  @cask.get("/api/prioritas")
  def getPrioritas() = {
    val jsonArr = Service.getDaftarPrioritas()
    cask.Response(jsonArr.render(), headers = Seq("Content-Type" -> "application/json"))
  }

  // Pengiriman
  @cask.postJson("/api/kirim")
  def postKirim(idBatch: Int, tujuan: String, tanggalKirim: String) = {
    try {
      val tgl = if tanggalKirim.nonEmpty then LocalDate.parse(tanggalKirim) else LocalDate.now()
      Service.eksekusiPengiriman(idBatch, tujuan, tgl) match {
        case Right(_) =>
          cask.Response(ujson.Obj("status" -> "sukses").render(), headers = Seq("Content-Type" -> "application/json"))
        case Left(pesan) =>
          cask.Response(ujson.Obj("status" -> "gagal", "pesan" -> pesan).render(), statusCode = 400, headers = Seq("Content-Type" -> "application/json"))
      }
    } catch {
      case e: Exception =>
        cask.Response(ujson.Obj("status" -> "gagal", "pesan" -> s"Error Database: ${e.getMessage}").render(), statusCode = 500, headers = Seq("Content-Type" -> "application/json"))
    }
  }

  // Riwayat
  @cask.get("/api/riwayat")
  def getRiwayat(bulan: Option[Int] = None, status: Option[String] = None, tujuan: Option[String] = None) = {
    val res = Service.getRiwayatDanRekap(bulan, status, tujuan)
    cask.Response(res.render(), headers = Seq("Content-Type" -> "application/json"))
  }

  // Static File
  @cask.staticFiles("/public")
  def staticFileRoutes() = new java.io.File("../frontend").getCanonicalPath()
  
  initialize()
}