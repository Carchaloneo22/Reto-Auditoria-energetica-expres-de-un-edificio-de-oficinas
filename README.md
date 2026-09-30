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
