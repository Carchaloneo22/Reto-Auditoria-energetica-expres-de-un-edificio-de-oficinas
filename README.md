# 🏢 Auditoría Energética Express — Edificio de Oficinas

> Un primer análisis energético con datos reales y un modelo visual, listo para presentar en una reunión de una hora.

## 📋 Descripción del Reto

Se nos entregan **45 días de mediciones horarias** de consumo energético de un edificio de oficinas (archivo `reto_edificio_oficinas.csv`) y se nos encarga realizar una **auditoría energética exprés**: un primer análisis con datos y un modelo, para presentar en una reunión de una hora. No hay instrucciones celda por celda — el objetivo es demostrar capacidad de análisis autónomo.

## 📁 Estructura del Proyecto

```text
Reto-Auditoria-energetica-expres-de-un-edificio-de-oficinas/
├── README.md
└── Auditoria energetica/
    ├── 02_Reto_Edificio_Oficinas_RESUELTO.ipynb   # Notebook con el análisis completo
    ├── reto_edificio_oficinas.csv                  # Dataset fuente (45 días, mediciones horarias)
    ├── index.html                                  # Dashboard web
    ├── styles.css                                  # Estilos del dashboard
    ├── app.js                                      # Lógica del dashboard
    ├── charts.js                                   # Gráficas del dashboard
    ├── datos.js                                    # Datos exportados para el frontend
    ├── datos_dashboard.json                        # Dataset en JSON para el dashboard
    └── dashboard_auditoria_energetica/dashboard/   # Copia del dashboard web
```

⚡ Qué Incluye

1. Análisis en Notebook (02_Reto_Edificio_Oficinas_RESUELTO.ipynb)
Carga y exploración del dataset (reto_edificio_oficinas.csv)
Limpieza y transformación de datos
Cálculo de indicadores energéticos clave:
Consumo total y por período
Demanda máxima y mínima
Patrones de consumo por hora del día y por día de la semana
Estimación de métricas de eficiencia
Identificación de anomalías y oportunidades de mejora

3. Dashboard Interactivo
Visualización de patrones de consumo
Gráficas de series temporales
Indicadores clave de rendimiento energético
Interfaz responsive pensada para exponer los hallazgos en la reunión

🚀 Cómo Usar
Ejecutar el análisis
Abrir Auditoria energetica/02_Reto_Edificio_Oficinas_RESUELTO.ipynb en Jupyter Notebook o JupyterLab
Asegurarse de que reto_edificio_oficinas.csv esté en la misma carpeta que el notebook
Ejecutar todas las celdas en orden
Ver el dashboard

Abrir Auditoria energetica/index.html en un navegador web
O abrir Auditoria energetica/dashboard_auditoria_energetica/dashboard/index.html

📊 Dataset

Archivo
reto_edificio_oficinas.csv
Período
45 días de mediciones continuas
Frecuencia
Horaria
Contenido
Consumo energético por intervalo de 1 hora
🛠️ Tecnologías
Python
Análisis de datos
Jupyter Notebook
Documentación y cálculo
HTML / CSS / JavaScript
Dashboard web
Chart.js (probable)
Gráficas interactivas
📝 Notas
El proyecto fue desarrollado como un reto autónomo, sin guía paso a paso
El enfoque es práctico: datos → modelo → presentación
El dashboard está diseñado para ser presentado en una reunión de una hora
