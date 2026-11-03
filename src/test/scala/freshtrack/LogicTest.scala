package freshtrack

import munit.FunSuite
import freshtrack.domain.Logic
import freshtrack.domain.StatusKesegaran.*
import java.time.LocalDate

class LogicTest extends FunSuite {

  test("hitungSisaUmur harus mengembalikan sisa hari yang benar") {
    val hariIni = LocalDate.of(2026, 11, 1)
    val tanggalPanen = LocalDate.of(2026, 10, 29)
    val umurSimpan = 5

    val sisa = Logic.hitungSisaUmur(tanggalPanen, umurSimpan, hariIni)
    assertEquals(sisa, 2)
  }

  test("tentukanStatus harus mengembalikan KRITIS jika sisa <= 1") {
    assertEquals(Logic.tentukanStatus(0), Kritis)
    assertEquals(Logic.tentukanStatus(1), Kritis)
  }

  test("tentukanStatus harus mengembalikan CUKUP jika sisa 2 atau 3") {
    assertEquals(Logic.tentukanStatus(2), Cukup)
    assertEquals(Logic.tentukanStatus(3), Cukup)
  }

  test("tentukanStatus harus mengembalikan SEGAR jika sisa > 3") {
    assertEquals(Logic.tentukanStatus(4), Segar)
    assertEquals(Logic.tentukanStatus(10), Segar)
  }
}