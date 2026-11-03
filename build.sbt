scalaVersion := "3.3.1"
name := "FreshTrack"
version := "0.1.0"

libraryDependencies ++= Seq(
  "com.lihaoyi" %% "cask" % "0.10.2",
  "ch.qos.logback" % "logback-classic" % "1.4.14",
  "org.scalameta" %% "munit" % "1.0.0" % Test
)