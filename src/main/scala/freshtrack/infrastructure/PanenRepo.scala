package freshtrack.infrastructure

import java.sql.{DriverManager, Statement}
import java.time.LocalDate
import freshtrack.domain.*

object PanenRepo {

  private def getConn() =
    DriverManager.getConnection(DbConfig.url, DbConfig.user, DbConfig.password)

  def ambilSemuaKomoditas(): List[Komoditas] = {
    var hasil = List.empty[Komoditas]
    val conn = getConn()
    try {
      val stmt = conn.createStatement()
      val rs = stmt.executeQuery("SELECT id, nama, umur_simpan_hari FROM komoditas ORDER BY nama ASC")
      while rs.next() do {
        hasil = hasil :+ Komoditas(
          rs.getInt("id"),
          rs.getString("nama"),
          rs.getInt("umur_simpan_hari")
        )
      }
    } finally {
      conn.close()
    }
    hasil
  }

  def simpanKomoditas(nama: String, umurSimpanHari: Int): Unit = {
    val conn = getConn()
    try {
      val sql = "INSERT INTO komoditas (nama, umur_simpan_hari) VALUES (?, ?) ON CONFLICT (nama) DO UPDATE SET umur_simpan_hari = EXCLUDED.umur_simpan_hari"
      val pstmt = conn.prepareStatement(sql)
      pstmt.setString(1, nama.trim)
      pstmt.setInt(2, umurSimpanHari)
      pstmt.executeUpdate()
    } finally {
      conn.close()
    }
  }

  def ambilSemuaPanen(): List[Panen] = {
    var hasil = List.empty[Panen]
    val conn = getConn()
    try {
      val stmt = conn.createStatement()
      val sql = """
        SELECT p.id, p.komoditas_id, k.nama AS nama_komoditas, k.umur_simpan_hari, p.lahan, p.berat_kg, p.tanggal_panen
        FROM panen p
        JOIN komoditas k ON p.komoditas_id = k.id
        ORDER BY p.id DESC
      """
      val rs = stmt.executeQuery(sql)
      while rs.next() do {
        hasil = hasil :+ Panen(
          rs.getInt("id"),
          rs.getInt("komoditas_id"),
          rs.getString("nama_komoditas"),
          rs.getInt("umur_simpan_hari"),
          rs.getString("lahan"),
          rs.getDouble("berat_kg"),
          rs.getDate("tanggal_panen").toLocalDate
        )
      }
    } finally {
      conn.close()
    }
    hasil
  }

  def simpanPanenDanBatch(komoditasId: Int, lahan: String, beratKg: Double, tanggalPanen: LocalDate, sisaUmur: Int, status: StatusKesegaran): Unit = {
    val conn = getConn()
    try {
      val sqlPanen = "INSERT INTO panen (komoditas_id, lahan, berat_kg, tanggal_panen) VALUES (?, ?, ?, ?)"
      val pstmtPanen = conn.prepareStatement(sqlPanen, Statement.RETURN_GENERATED_KEYS)
      pstmtPanen.setInt(1, komoditasId)
      pstmtPanen.setString(2, lahan.trim)
      pstmtPanen.setDouble(3, beratKg)
      pstmtPanen.setDate(4, java.sql.Date.valueOf(tanggalPanen))
      pstmtPanen.executeUpdate()

      val keys = pstmtPanen.getGeneratedKeys
      if keys.next() then {
        val panenId = keys.getInt(1)
        val sqlBatch = "INSERT INTO batch (panen_id, sisa_umur_hari, status, sudah_dikirim) VALUES (?, ?, ?, false)"
        val pstmtBatch = conn.prepareStatement(sqlBatch)
        pstmtBatch.setInt(1, panenId)
        pstmtBatch.setInt(2, sisaUmur)
        pstmtBatch.setString(3, status.toString)
        pstmtBatch.executeUpdate()
      }
    } finally {
      conn.close()
    }
  }

  def ambilSemuaBatch(): List[Batch] = {
    var hasil = List.empty[Batch]
    val conn = getConn()
    try {
      val stmt = conn.createStatement()
      val rs = stmt.executeQuery("SELECT id, panen_id, sisa_umur_hari, status, sudah_dikirim FROM batch ORDER BY id DESC")
      while rs.next() do {
        val statusStr = rs.getString("status")
        val statusEnum = StatusKesegaran.values.find(_.toString.equalsIgnoreCase(statusStr)).getOrElse(StatusKesegaran.Segar)
        hasil = hasil :+ Batch(
          rs.getInt("id"),
          rs.getInt("panen_id"),
          rs.getInt("sisa_umur_hari"),
          statusEnum,
          rs.getBoolean("sudah_dikirim")
        )
      }
    } finally {
      conn.close()
    }
    hasil
  }

  def catatPengiriman(idBatch: Int, tanggalKirim: LocalDate, tujuan: String): Boolean = {
    val conn = getConn()
    try {
      val sqlUpdate = "UPDATE batch SET sudah_dikirim = true WHERE id = ? AND sudah_dikirim = false"
      val pstmtUpdate = conn.prepareStatement(sqlUpdate)
      pstmtUpdate.setInt(1, idBatch)
      val updated = pstmtUpdate.executeUpdate()

      if updated > 0 then {
        val sqlInsert = "INSERT INTO pengiriman (batch_id, tanggal_kirim, tujuan, status_kirim) VALUES (?, ?, ?, 'Terkirim')"
        val pstmtInsert = conn.prepareStatement(sqlInsert)
        pstmtInsert.setInt(1, idBatch)
        pstmtInsert.setDate(2, java.sql.Date.valueOf(tanggalKirim))
        pstmtInsert.setString(3, tujuan.trim)
        pstmtInsert.executeUpdate()
        true
      } else {
        false
      }
    } finally {
      conn.close()
    }
  }

  def ambilSemuaPengiriman(): List[Pengiriman] = {
    var hasil = List.empty[Pengiriman]
    val conn = getConn()
    try {
      val stmt = conn.createStatement()
      val rs = stmt.executeQuery("SELECT id, batch_id, tanggal_kirim, tujuan, status_kirim FROM pengiriman ORDER BY id DESC")
      while rs.next() do {
        hasil = hasil :+ Pengiriman(
          rs.getInt("id"),
          rs.getInt("batch_id"),
          rs.getDate("tanggal_kirim").toLocalDate,
          rs.getString("tujuan"),
          rs.getString("status_kirim")
        )
      }
    } finally {
      conn.close()
    }
    hasil
  }
}