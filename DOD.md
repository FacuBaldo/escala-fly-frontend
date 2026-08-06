# Definition of Done (DoD) - Proyecto Aeroaplicaciones

Este documento establece los criterios que **toda Historia de Usuario o Tarea** debe cumplir obligatoriamente para poder ser movida a la columna "Terminado" (Done) en el tablero de Jira durante cualquier Sprint.

## Criterios Generales
1. **El código compila y se ejecuta sin errores** tanto en el entorno Frontend (React) como en el Backend (Node.js/Express).
2. **Cumple con los Criterios de Aceptación** definidos específicamente en la tarjeta de Jira de esa historia.
3. **Se probó la funcionalidad principal** y no rompe funcionalidades anteriores (regresión).

## Base de Datos (PostgreSQL/PostGIS)
4. Si la tarea involucró cambios en la base de datos, los scripts SQL (tablas, modificaciones) fueron compartidos con el equipo o volcados en la base de datos común.

## Frontend (React & Tailwind CSS)
5. La interfaz de usuario es funcional y tiene estilos aplicados usando **Tailwind CSS**. No hay elementos superpuestos o ilegibles.
6. La consola del navegador no muestra errores críticos (rojos) al cargar la pantalla.

## Repositorio (GitHub)
7. El código final fue subido (`git push`) a su rama correspondiente en GitHub.
8. El código fue integrado a la rama `main` mediante un Pull Request (PR) y fue revisado/aprobado por al menos un compañero.
