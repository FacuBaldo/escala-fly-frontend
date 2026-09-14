# Bitácora — Sprint 2 Frontend: Gestión de lotes georreferenciados

**Historia de usuario:** HU-03 – Gestionar lotes agrícolas y su información georreferenciada
**Rama:** `sprint2-frontend-lotes` (frontend) · depende de `sprint2-backend-lotes` (backend)
**Responsable frontend:** Valentino Bono · **Backend:** Martiniano Giménez

> Nota de trazabilidad: el PR del backend (#6) y la guía de integración numeran las historias como HU-04, HU-05 y HU-06. En el Product Backlog de la tesis la gestión de lotes corresponde a la **HU-03**; conviene unificar la numeración en el informe.

---

## 1. Cronología

| Fecha | Evento |
|---|---|
| 13/09/2026 | Martiniano publica la rama `sprint2-backend-lotes`: modelo `Lote` con PostGIS, CRUD en `/api/lotes`, cálculo de superficie y baja lógica. La migración se aplica sobre la base compartida de Railway. |
| 13/09/2026 | Martiniano entrega la guía `FRONTEND_GUIDE_LOTES.md` con el contrato de la API y recomendaciones de librerías. |
| 14/09/2026 | Se crea la rama `sprint2-frontend-lotes` desde `main` y se instalan `leaflet`, `react-leaflet` y `@geoman-io/leaflet-geoman-free`. |
| 14/09/2026 | Se implementan la capa de API, el mapa, el formulario, la página `/lotes`, la ruta protegida y el ítem de menú. |
| 14/09/2026 | Pruebas de integración contra el backend real (API y navegador). Se detecta que el backend acepta polígonos autointersectados (ver §6). |
| 14/09/2026 | Ajustes finales: carga diferida de la página de lotes y corrección del texto de ayuda de edición. |
| 14/09/2026 | Corrección en el backend (commit `c19425c` en `sprint2-backend-lotes`): validación topológica de polígonos con `ST_IsValid` en alta y edición. |
| 14/09/2026 | Corrección de las observaciones restantes de lotes (`b298f85`) y de los errores generales detectados en la revisión del código (ramas `fix/correcciones-backend` y `fix/correcciones-frontend`), verificadas con pruebas de API y de navegador. |
| 14/09/2026 | Ajuste pedido por el interesado: el `ENCARGADO` también puede eliminar lotes de su empresa, porque administra los campos y sus lotes (backend `57dcb45`). |
| 14/09/2026 | Ajuste pedido por el interesado: solo el `ADMIN` elimina empresas y, al hacerlo, se eliminan en cascada sus usuarios, campos y lotes, productos y aeronaves. Al eliminar un campo también se eliminan sus lotes (backend `87cbf1d`). |

---

## 2. Funcionalidad entregada

Página **Lotes** (`/lotes`), accesible para los roles `ADMIN` y `ENCARGADO`:

- **Visualización:** mapa satelital con los lotes dibujados como polígonos. Colores: verde = activo, gris punteado = dado de baja, ámbar = seleccionado. Tooltip con nombre y superficie.
- **Filtros:** por campo (consulta al backend con `campoId`) y por estado (activos / dados de baja, filtrado en cliente). Resumen con cantidad de lotes y hectáreas activas.
- **Alta:** botón "Dibujar lote" → el usuario marca los vértices sobre el mapa → al cerrar el polígono se abre un formulario (nombre, campo, descripción) → el backend calcula la superficie y se informa en la notificación.
- **Edición de datos:** nombre, campo y descripción mediante formulario.
- **Edición de forma:** arrastre de vértices sobre el mapa (clic derecho elimina un vértice). Al guardar, el backend recalcula la superficie.
- **Baja lógica y reactivación**, con confirmación para la baja.
- **Eliminación permanente:** disponible para `ADMIN` y `ENCARGADO`, ya que el encargado administra los campos y sus lotes. El backend verifica que el lote pertenezca a la empresa del encargado.
- Panel lateral con la lista de lotes sincronizada con el mapa (seleccionar en la lista centra el mapa en el lote).

### Relación con los criterios de aceptación de HU-03

| Criterio | Cómo se cumple |
|---|---|
| CA-01: registrar, modificar y eliminar lotes | Alta por dibujo, edición de datos y de forma, baja lógica y eliminación permanente. |
| CA-02: cargar y visualizar información georreferenciada sobre mapas | Dibujo de polígonos con Geoman y visualización sobre mapa satelital; persistencia en PostGIS como GeoJSON. |
| CA-03: lotes disponibles para planificación de rutas y órdenes | Los lotes quedan persistidos con geometría y superficie, asociados a un campo; la baja lógica permite excluirlos sin perder historial. |

---

## 3. Decisiones técnicas

### 3.1. Leaflet + React-Leaflet (en lugar de MapLibre GL u OpenLayers)
- Coincide con la combinación propuesta en el Sprint 0.
- Curva de aprendizaje baja y soporte directo de polígonos y GeoJSON.
- La cantidad de geometrías esperada (decenas o cientos de lotes por empresa) no justifica el renderizado WebGL de MapLibre.
- `react-leaflet` 5 es la versión compatible con React 19.

### 3.2. Geoman para dibujo y edición
- Permite dibujar y editar vértices sin construir la interacción a mano.
- Se usa en forma **programática** (sin su barra de herramientas) para que el flujo lo controle la página: botón "Dibujar lote", banner de instrucciones y botones Guardar / Cancelar.
- Opción `allowSelfIntersection: false` en dibujo y edición: impide trazar polígonos que se cruzan a sí mismos. El backend además los rechaza (§6), de modo que la regla se aplica en ambas capas.

### 3.3. Mapas base
- **Satelital (Esri World Imagery)** por defecto: permite reconocer los límites reales de los lotes. Gratuito y sin API key.
- **Calles (OpenStreetMap)** como capa alternativa.
- Ambas cumplen la restricción del proyecto de usar servicios gratuitos (RNF-11).

### 3.4. Orden de coordenadas
- El backend y GeoJSON usan `[longitud, latitud]`; Leaflet usa `[latitud, longitud]`.
- La conversión se centraliza en una única función (`toLatLngs` en `MapaLotes.jsx`). Para enviar al backend se usa `layer.toGeoJSON().geometry`, que ya devuelve el formato estándar.

### 3.5. La superficie la calcula el backend
- El frontend no calcula hectáreas: envía la geometría y muestra el valor devuelto por PostGIS (`ST_Area` geodésica). Así hay una única fuente de verdad y se evitan diferencias por proyección.

### 3.6. Carga diferida del módulo
- Leaflet y Geoman agregan unos 450 kB al código. La página se carga con `React.lazy`, de modo que solo se descargan al entrar a Lotes.
- Resultado: el bundle principal pasó de 790 kB a 340 kB y desapareció la advertencia de tamaño de Vite.

### 3.7. Filtro por estado en el cliente
- El filtro por campo consulta al backend; el de estado se aplica sobre los datos ya cargados para que el cambio sea instantáneo y el resumen de hectáreas se recalcule sin nuevas peticiones.

---

## 4. Arquitectura

Se respetó la estructura existente del frontend (una página por entidad, capa `api/` sobre `apiClient`, diálogos reutilizables, notificaciones y rutas protegidas por rol):

```
src/
├── api/lotesApi.js              → llamadas HTTP a /api/lotes (mismo patrón que camposApi.js)
├── utils/lotes.js               → formateo de superficie (es-AR, hectáreas)
├── components/lotes/
│   ├── MapaLotes.jsx            → mapa, capas base, polígonos y controles de Geoman
│   └── LoteForm.jsx             → formulario de nombre, campo y descripción
├── pages/LotesPage.jsx          → estado de la pantalla, filtros, modos y acciones
├── App.jsx                      → ruta /lotes protegida (ADMIN, ENCARGADO), carga diferida
└── components/AppLayout.jsx     → ítem "Lotes" en el menú lateral
```

**Separación de responsabilidades:**
- `LotesPage` maneja el estado y los **modos** de la pantalla (`ver`, `dibujar`, `editar-forma`), las llamadas a la API y las notificaciones.
- `MapaLotes` solo representa y comunica eventos (`onPoligonoDibujado`, `onGeometriaEditada`, `onSelectLote`); no conoce la API.
- Dentro del mapa, cada comportamiento es un componente pequeño que usa `useMap()`: `AjustarVista` (encuadre), `ControlDibujo` y `ControlEdicion`.

**Flujo de datos del alta:**
`Dibujar lote` → Geoman (`pm:create`) → `geometry` GeoJSON → formulario → `POST /api/lotes` → PostGIS calcula la superficie → respuesta → recarga de la lista y del mapa.

Los permisos se aplican en dos niveles: el frontend oculta las acciones no permitidas y el backend las valida (`verificarToken`, `permitirRoles` y aislamiento por empresa).

---

## 5. Pruebas realizadas

### 5.1. Integración con la API (backend `sprint2-backend-lotes` + base de Railway)
Script con los mismos payloads que genera el frontend, autenticado como `ENCARGADO` y `ADMIN`:

| Prueba | Resultado |
|---|---|
| Crear lote (encargado) | ✅ 201 · 105,41 ha |
| Listar por campo con geometría y nombre de campo | ✅ |
| Editar datos (formulario) | ✅ |
| Editar forma → recalcula superficie | ✅ 105,41 → 210,82 ha |
| Dar de baja / reactivar | ✅ |
| Encargado intenta eliminar | ✅ 403 (regla inicial; luego se habilitó al encargado, ver §1) |
| Encargado elimina un lote de su empresa / de otra empresa | ✅ 200 / 404 (tras el ajuste) |
| Admin elimina / lote ya no existe | ✅ 200 / 404 |
| Polígono autointersectado rechazado | ❌ inicialmente se guardaba con 0 ha → ✅ 400 tras la corrección (ver §6) |

Pruebas agregadas tras la corrección del backend:

| Prueba | Resultado |
|---|---|
| Crear polígono en forma de "moño" | ✅ 400 · "El polígono del lote no puede cruzarse a sí mismo" |
| Crear polígono sin superficie (vértices alineados) | ✅ 400 |
| Crear polígono válido enviado como `Feature` | ✅ 201 · 105,41 ha |
| Editar un lote a una forma de "moño" | ✅ 400 y la forma previa queda intacta |
| Editar solo el nombre (sin geometría) | ✅ 200 |
| Coordenadas no numéricas | ✅ 400 |

### 5.2. Prueba en navegador (Chrome, flujo completo de usuario)
Automatizada con Playwright sobre la aplicación en ejecución (Vite + backend):
1. Carga de la página y del mapa satelital. ✅
2. Dibujo de un polígono con clics y cierre en el primer vértice → se abre el formulario. ✅
3. Alta → notificación "Lote creado correctamente (4.691,56 ha)". ✅
4. Edición de forma arrastrando un vértice → "Forma del lote actualizada (5.437,62 ha)". ✅
5. Baja con confirmación → el lote aparece "De baja". ✅
6. El `ENCARGADO` puede eliminar permanentemente un lote con confirmación. ✅
7. Sin errores en la consola del navegador. ✅

Los datos de prueba se eliminaron al finalizar.

Verificaciones adicionales: `eslint` sin errores en los archivos nuevos y `vite build` exitoso.

---

## 6. Problemas detectados y pendientes

1. ~~**Backend acepta polígonos autointersectados**~~ — **Resuelto** (commit `c19425c`). Los polígonos en forma de "moño" se guardaban con superficie 0. Ahora, antes del `INSERT`/`UPDATE`, se valida la geometría con `ST_IsValid` y se exige superficie mayor a cero; si no se cumple, la API responde 400 con un mensaje claro.
2. ~~**Otras observaciones sobre el backend de lotes**~~ — **Resuelto** (commit `b298f85`): se validan y cierran también los huecos del polígono, `activo` acepta `"true"`/`"false"` y rechaza valores inválidos, se valida el tipo de `nombre`, `descripcion` y `campoId`, y la ruta `DELETE` quedó restringida a `ADMIN`.
3. **Base compartida adelantada:** la migración de lotes ya está aplicada en Railway pero no en `main`. No ejecutar `prisma migrate dev` desde `main` hasta integrar la rama del backend.
4. ~~**Error de lint previo** en `src/context/AutenticacionProvider.jsx`~~ — **Resuelto** en la rama `fix/correcciones-frontend`: el estado de la sesión se deriva del token en lugar de sincronizarse con `setState` dentro de un efecto.
5. **Correcciones generales detectadas en la revisión** (ramas `fix/correcciones-backend` y `fix/correcciones-frontend`): permisos del `ENCARGADO` sobre usuarios, validaciones de datos, eliminación de empresas en cascada (solo `ADMIN`) y de campos junto con sus lotes, manejo global de errores, límite de intentos de inicio de sesión y script para crear el primer `ADMIN`. El frontend de usuarios se alineó con las nuevas reglas.
6. **Integración:** según la Definition of Done, ambos PRs (frontend y backend) deben ser revisados por al menos un compañero antes de mergearse a `main`. Mergear primero el backend.

---

## 7. Notas para el informe del sprint

- **Riesgo RI-03 (falta de experiencia geoespacial):** se mitigó apoyándose en librerías maduras (PostGIS, Leaflet, Geoman) y en una guía de integración escrita por el responsable del backend, lo que permitió desarrollar el frontend en paralelo sin bloqueos. Esto responde a la mejora acordada en la retrospectiva del Sprint 1 (reducir dependencias entre tareas).
- **Riesgo RI-09 (integración de módulos):** se validó la integración frontend–backend–PostGIS con pruebas automáticas antes del merge.
- **Riesgo RI-10 (servicios de mapas):** se dejaron dos proveedores de mapa base intercambiables (Esri y OpenStreetMap).
- **Calidad:** la prueba de integración detectó un defecto real en la validación de geometrías del backend (polígonos autointersectados guardados con 0 ha). Se registró y corrigió dentro del mismo sprint, con pruebas que verifican la corrección.
- **Evidencias para el informe:** capturas del mapa con lotes, del modo dibujo, del formulario y de la edición de vértices.
