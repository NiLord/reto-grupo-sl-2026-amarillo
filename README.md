# Vending Machine Pro (Equipo Amarillo)

Solución de Frontend moderna para el reto de Máquina Expendedora - Rally Enero 2026.
Este proyecto implementa la **Capa de Presentación** de una Arquitectura de 3 Capas.

## Equipo
* **Frontend:** Moisés & [Nombre de tu Compañera]
* **Backend:** [Nombres de los compañeros de Back]
* **Grupo:** SL 2026 Amarillo

## Stack Tecnológico
* **React 18:** Manejo de estado y componentes reactivos.
* **Tailwind CSS:** Diseño UI/UX moderno y responsive (Utility-first).
* **Vite:** Entorno de desarrollo ultrarrápido.
* **Fetch API:** Conexión asíncrona con el Backend REST.

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

```text
frontend/
├── index.html           # Punto de entrada (con inyección de Tailwind)
├── src/
│   ├── App.jsx          # Componente Principal (Lógica de Negocio + UI)
│   ├── main.jsx         # Montaje de la aplicación React
│   └── index.css        # Directivas de Tailwind
├── public/              # Assets estáticos
└── package.json         # Dependencias del proyecto
