scalaVersion := "3.3.1"
name := "FreshTrack"
version := "0.1.0"

libraryDependencies ++= Seq(
  "com.lihaoyi" %% "cask" % "0.9.1",
  "com.lihaoyi" %% "ujson" % "3.1.3",
  "org.postgresql" % "postgresql" % "42.6.0"
)