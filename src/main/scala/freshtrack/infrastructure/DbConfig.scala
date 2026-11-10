package freshtrack.infrastructure

import java.util.Properties



object DbConfig {
  private val props = new Properties()
  private val stream = getClass.getClassLoader.getResourceAsStream("application.conf")
  if stream != null then props.load(stream)

  val url: String = props.getProperty("db.url", "jdbc:postgresql://localhost:5432/DBFRESHTRACK").replace("\"", "")
  val user: String = props.getProperty("db.user", "postgres").replace("\"", "")
  val password: String = props.getProperty("db.password", "Lazuaros_7").replace("\"", "")
}