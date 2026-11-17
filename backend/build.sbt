ThisBuild / scalaVersion := "3.3.3"

lazy val root = (project in file("."))
  .settings(
    name := "FreshTrack",
    libraryDependencies ++= Seq(
      "com.lihaoyi" %% "cask" % "0.9.1",
      "org.postgresql" % "postgresql" % "42.7.2",
      "org.scalameta" %% "munit" % "1.0.0" % Test
    )
  )
