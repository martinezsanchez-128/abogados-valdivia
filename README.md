# Valdivia — Landing page

Sitio estático en español, sin dependencias ni compilación. HTML, CSS y JavaScript separados para facilitar el mantenimiento.

## Abrir

Abre `index.html` en tu navegador. Todos los recursos visuales están incluidos y funcionan sin una conexión a Internet. Los contactos, mapas, Instagram y enlaces a fuentes requieren conexión.

Para desarrollo con servidor local, desde esta carpeta:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Visita http://localhost:4173.

## Estructura

- `index.html`: estructura semántica, navegación y secciones.
- `css/styles.css`: estilos agrupados, variables de diseño, responsive y movimiento reducido.
- `js/content.js`: servicios, recomendaciones, clientes y número de WhatsApp.
- `js/main.js`: renderizado de tarjetas, diálogo y menú móvil.
- `js/carousels.js`: reproducción, pausa, navegación manual y bucle de los carruseles.
- `assets/`: logo y fotografías originales, logos de clientes en SVG.

## Edición

Edita `SITE_CONTENT` en `js/content.js` para cambiar servicios, reseñas, logos o WhatsApp. Los servicios se muestran en seis categorías; el detalle incluye los trámites publicados en el sitio original. El contacto usa WhatsApp +52 81 8088 2372 y teléfono 81 8344 9121, ambos publicados en la referencia.

Los carruseles avanzan visualmente de izquierda a derecha. Se pausan al enfocar con teclado, deslizar en móvil o usar las flechas. El cursor no interrumpe la reproducción. El botón central permite pausar y reanudar. Respetan `prefers-reduced-motion`.

## Comprobaciones de desarrollo

Con Node.js instalado, ejecuta las pruebas sin instalar dependencias:

```sh
node --test tests/carousels.test.cjs
```

Las pruebas simulan anchos de 320 a 1440 píxeles, redondeo del desplazamiento, bucles prolongados, reproducción/pausa, flechas, teclado, tacto, cambios de orientación y movimiento reducido. No sustituyen una revisión visual en navegadores reales.

El formato del HTML, CSS y JavaScript sigue `.prettierrc.json`. La lógica de los carruseles está separada del renderizado del contenido para facilitar su mantenimiento.

## Fuentes y alcance editorial

Referencia: https://abogadosmigratoriosvaldivia.godaddysites.com/ y sus secciones `/nuestros-servicios`, `/recomendaciones`, `/nuestros-socios`.

Se conserva el logo original y fotografías del despacho y su director. La redacción de presentación es una adaptación editorial; misión y visión conservan el sentido del original.

Cuatro reseñas se transcribieron de las imágenes visibles. El nombre del autor no era legible: se usa «Cliente del despacho», sin inventar identidades. Las fechas son las publicaciones del sitio, no las fechas de Google. No existe conexión a la API de Google; cada tarjeta enlaza a la publicación original. Las estrellas proceden de las imágenes, sin inferir una calificación global.

Los logos de clientes se separaron del montaje original mediante viewBox y filtros SVG: fondo transparente y marcas monocromáticas. Kinetica y TKA se recrearon como wordmarks en SVG para eliminar sus fondos de color. La resolución está limitada por la imagen fuente; para producción se recomienda sustituirlos por los archivos vectoriales de cada marca.

El diseño no incluye formularios con backend ni analítica. Los botones de consulta abren WhatsApp con un mensaje editable; no envían mensajes automáticamente. Antes de publicar, el despacho debe revisar los textos finales y las autorizaciones de uso de testimonios y marcas.
