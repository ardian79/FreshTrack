//> using scala 3.3.3
//> using dep com.lihaoyi::cask:0.9.2
//> using dep org.postgresql:postgresql:42.7.3
//> using resourceDir ../resources

package freshtrack

object Main extends cask.Main {
  val allRoutes = Seq(Routes)

  override def main(args: Array[String]): Unit = {
    super.main(args)
    println("Server FreshTrack berjalan di http://localhost:8080")
    println("Tekan ENTER untuk mematikan server...")
    scala.io.StdIn.readLine()
    println("Mematikan server...")
    sys.exit(0)
  }
}