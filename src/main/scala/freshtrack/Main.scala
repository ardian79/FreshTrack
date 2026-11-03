package freshtrack

import freshtrack.web.Routes

object Main extends cask.Main {
  val allRoutes = Seq(Routes)

  override def main(args: Array[String]): Unit = {
    super.main(args)
    println("Server FreshTrack berjalan di http://localhost:8080")
    println("Tekan ENTER untuk mematikan server...")
    scala.io.StdIn.readLine()
  }
}