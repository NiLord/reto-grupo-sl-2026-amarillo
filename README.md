# Vending Machine Pro (Equipo Amarillo)

Solución de Frontend moderna para el reto de Máquina Expendedora - Rally Enero 2026.
Este proyecto implementa la **Capa de Presentación** de una Arquitectura de 3 Capas.

## Equipo
* **Frontend:** Moisés Delgado, Emily Barba
* **Backend:** Alexis Pinel, Gabriel Armuelles, Eric Soto, Denilson Alvarado.
* **Grupo:** SL 2026 Amarillo

## Stack Tecnológico
* **React 18:** Manejo de estado y componentes reactivos.
* **Vite:** Entorno de desarrollo ultrarrápido.
* **Fetch API:** Conexión asíncrona con el Backend REST.
* **MySQL:** Base de datos
* **Docker:** Alojamiento de base de dato en máquina local
* **phpMyAdmin:** Administrador de DB

## Funcionalidades Principales
1.  **Catálogo Visual:** Renderizado dinámico de productos con imágenes y control de stock.
2.  **Carrito Inteligente:**

    * Permite seleccionar múltiples unidades.
    * Valida contra el stock disponible en tiempo real.
3.  **Sistema de Pago Simulado:**
    * Acepta denominaciones específicas (5¢, 10¢, 25¢, $1, $5, $10).
    * Calcula el total a pagar vs. dinero ingresado.
    * Bloquea la compra si el saldo es insuficiente.
4.  **Feedback al Usuario:** Mensajes de estado (éxito/error) y validaciones visuales.

## Estructura del Proyecto
El código sigue una estructura modular para facilitar la escalabilidad:

```
frontend/
├── index.html           # Punto de entrada (con inyección de Tailwind)
├── src/
│   ├── App.jsx          # Componente Principal (Lógica de Negocio + UI)
│   ├── main.jsx         # Montaje de la aplicación React
│   └── index.css        # Directivas de Tailwind
├── public/              # Assets estáticos[Proyecto_Rally.sql](https://github.com/user-attachments/files/25024648/Proyecto_Rally.sql)
└── package.json         # Dependencias del proyecto

## SCRIPT DE LA BASE DE DATOS
-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Servidor: db
-- Tiempo de generación: 02-02-2026 a las 20:27:03
-- Versión del servidor: 8.0.44
-- Versión de PHP: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `Proyecto_Rally`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Cantidad`
--

CREATE TABLE `Cantidad` (
  `id` int NOT NULL,
  `cantidad` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Monedas`
--

CREATE TABLE `Monedas` (
  `id_moneda` int NOT NULL,
  `valor` decimal(10,2) DEFAULT NULL,
  `tipo` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Productos`
--

CREATE TABLE `Productos` (
  `id_productos` int NOT NULL,
  `nombre` varchar(25) DEFAULT NULL,
  `costos` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `Cantidad`
--
ALTER TABLE `Cantidad`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `Monedas`
--
ALTER TABLE `Monedas`
  ADD PRIMARY KEY (`id_moneda`);

--
-- Indices de la tabla `Productos`
--
ALTER TABLE `Productos`
  ADD PRIMARY KEY (`id_productos`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `Cantidad`
--
ALTER TABLE `Cantidad`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `Monedas`
--
ALTER TABLE `Monedas`
  MODIFY `id_moneda` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `Productos`
--
ALTER TABLE `Productos`
  MODIFY `id_productos` int NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `Monedas`
--
ALTER TABLE `Monedas`
  ADD CONSTRAINT `Monedas_ibfk_1` FOREIGN KEY (`id_moneda`) REFERENCES `Cantidad` (`id`);

--
-- Filtros para la tabla `Productos`
--
ALTER TABLE `Productos`
  ADD CONSTRAINT `Productos_ibfk_1` FOREIGN KEY (`id_productos`) REFERENCES `Cantidad` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
