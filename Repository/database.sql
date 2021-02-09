-- MySQL dump 10.13  Distrib 8.0.22, for Linux (x86_64)
--
-- Host: localhost    Database: SleepingRepo
-- ------------------------------------------------------
-- Server version	8.0.22-0ubuntu0.20.04.3

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Misurazione`
--

DROP TABLE IF EXISTS `Misurazione`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Misurazione` (
  `Id` char(40) NOT NULL,
  `Data` date NOT NULL,
  `UserID` char(30) DEFAULT NULL,
  `EEG` text,
  `EKG` text,
  `EOG` text,
  `EMG` text,
  `SpO2` text,
  `Centre_Of_Gravity` text,
  `Feet` text,
  `Nasal_Flow` text,
  `Impedence` text,
  PRIMARY KEY (`Id`,`Data`),
  KEY `UserID` (`UserID`),
  CONSTRAINT `Misurazione_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `Ricercatore` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Misurazione`
--

LOCK TABLES `Misurazione` WRITE;
/*!40000 ALTER TABLE `Misurazione` DISABLE KEYS */;
/*!40000 ALTER TABLE `Misurazione` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Ricercatore`
--

DROP TABLE IF EXISTS `Ricercatore`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Ricercatore` (
  `ID` char(30) NOT NULL,
  `Nome` char(30) DEFAULT NULL,
  `Cognome` char(30) DEFAULT NULL,
  `Istituzione` char(70) DEFAULT NULL,
  `Email` char(50) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Ricercatore`
--

LOCK TABLES `Ricercatore` WRITE;
/*!40000 ALTER TABLE `Ricercatore` DISABLE KEYS */;
/*!40000 ALTER TABLE `Ricercatore` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-02-09 16:59:12
