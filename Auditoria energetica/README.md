# Tablero · Auditoría energética exprés (edificio de oficinas)

Tablero web adaptable (escritorio, tableta y móvil) hecho con HTML, CSS y JavaScript puro, sin librerías.

## Estructura

```
dashboard/
├── index.html              Estructura y contenido de la página
├── css/styles.css          Estilos, tema claro/oscuro y reglas responsive
├── js/charts.js            Mini motor de gráficos SVG que se redibujan al cambiar el tamaño
├── js/app.js               Lógica: fachada, tablas, gráficos, simulador y calculadora de ahorro
└── data/
    ├── datos.js            Datos listos para el navegador (window.DATA = {...})
    └── datos_dashboard.json  Mismo contenido, exportado por el notebook de Python
```

## Cómo abrirlo

- **Local:** doble clic en `index.html`. Funciona sin servidor porque los datos se cargan desde `data/datos.js`.
- **Publicarlo:** suba la carpeta completa a GitHub Pages, Netlify o cualquier hosting estático.

## Cómo actualizar los datos

1. Ejecute el notebook `02_Reto_Edificio_Oficinas_RESUELTO.ipynb`; la última celda genera `datos_dashboard.json`.
2. Convierta el JSON en `datos.js`:
   ```bash
   (printf 'window.DATA = '; cat datos_dashboard.json; printf ';\n') > data/datos.js
   ```
   En Windows (PowerShell):
   ```powershell
   "window.DATA = " + (Get-Content datos_dashboard.json -Raw) + ";" | Set-Content data/datos.js -Encoding utf8
   ```
3. Recargue la página. Cifras, gráficos, simulador y conclusión se recalculan solos.

## Qué se adapta según la pantalla

| Elemento | Escritorio / tableta | Móvil (≤ 640 px) |
|---|---|---|
| Fachada (mapa de calor) | Columnas = días, filas = horas | Filas = días, columnas = horas (sin scroll lateral) |
| Tablas | Tabla clásica | Tarjetas con etiqueta por campo (≤ 700 px) |
| Gráficos | Proporción panorámica, más marcas en los ejes | Más altos y con menos etiquetas |
| Cifras clave | 4 columnas | 2 columnas (1 en pantallas muy estrechas) |
| Detalle de cada hora | Pasar el cursor | Tocar la celda o el gráfico |

También incluye navegación fija por secciones, tema claro/oscuro (se recuerda en el navegador), respeto a "reducir movimiento" y estilos de impresión.
