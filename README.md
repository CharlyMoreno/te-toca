# Te Toca

**Una casa compartida, turnos claros.**

Te Toca es un juego de navegador para parejas y compañeros de vivienda que organiza las tareas recurrentes del hogar. Muestra qué hay que hacer, a quién le toca y qué se completó, con turnos automáticos y la posibilidad de intercambiarlos de común acuerdo.

El jugador recorre una pequeña casa 3D con su avatar. En cada habitación encuentra objetos que representan tareas reales. Al confirmar que hizo una, el avatar interactúa con el objeto y el ambiente se ordena. Los avatares de los demás integrantes muestran sus tareas hechas, pendientes y atrasadas.

La definición de pantallas, flujos y reglas de uso está en [la especificación funcional del MVP](docs/MVP_FUNCIONAL.md).
El [modelo de datos](docs/DB_MODEL.md) separa el esquema de acceso ya creado de las tablas previstas para las tareas.

Estado: primer módulo implementado (acceso, creación de casa y unión por código). El recorrido 3D, las tareas y los intercambios siguen definidos para el MVP. Te Toca es el nombre propuesto; su disponibilidad comercial y de dominio no fue verificada.

## Problema

En una casa compartida, recordar qué falta hacer y decidir quién lo hace puede recaer siempre sobre la misma persona. Los acuerdos verbales se olvidan y las tareas se vuelven a negociar cada semana.

La aplicación busca responder tres preguntas de inmediato:

- ¿Qué está pendiente?
- ¿A quién le toca?
- ¿Puedo cambiar mi turno con alguien?

## Público inicial

Parejas y grupos pequeños de compañeros de vivienda que quieren repartir tareas domésticas recurrentes mediante una rotación sencilla. El alcance inicial contempla entre dos y seis integrantes por hogar.

## Propuesta de valor

- Hacer visibles las responsabilidades sin que una persona tenga que recordarlas constantemente.
- Asignar turnos con una regla que todos puedan entender.
- Permitir cambios acordados cuando alguien no puede cumplir un turno.
- Consultar un historial compartido para recordar lo realizado.
- Convertir la casa 3D y sus avatares en una forma de navegar los pendientes y reconocer el progreso de cada integrante.

La hipótesis es que una lista compartida con responsables claros reduce las conversaciones repetidas sobre quién debe hacer cada cosa. La rotación reparte turnos por tarea; no garantiza igual esfuerzo total entre personas.

## Objetivo del MVP

Un hogar puede registrar sus integrantes, configurar tareas recurrentes y recorrer una casa 3D para verlas y resolverlas en su habitación. El juego refleja el progreso de las tareas hechas en el mundo real mediante avatares, objetos y cambios en la casa. Una lista general permite consultar todo el hogar y sirve como alternativa accesible.

## Flujo principal

1. Una persona inicia sesión, crea un hogar y elige su zona horaria.
2. Comparte un código de invitación con los demás integrantes, que crean su perfil y se unen a la casa.
3. Crea tareas indicando habitación, frecuencia, primera fecha y participantes de la rotación.
4. La aplicación asigna el primer turno y muestra en cada habitación cuántas tareas hay pendientes. Los avatares resumen lo hecho y lo pendiente de cada persona.
5. El integrante elige una habitación; su avatar camina hacia ella y la cámara lo sigue. Allí ve los objetos que representan las tareas de hoy y las atrasadas, junto con el responsable de cada una.
6. Tras hacer una tarea en la vida real, confirma «Ya la hice». El avatar realiza una animación breve, el objeto se ordena o desaparece y la acción queda registrada.
7. La siguiente ocurrencia corresponde al próximo integrante de la rotación.
8. Si necesita cambiar un turno, el integrante propone un intercambio con una tarea de otra persona; el cambio se aplica cuando esta lo acepta.

## Pantallas

### Inicio: nuestra casa

- Casa 3D con cuatro ambientes fijos: cocina, baño, dormitorio y zona común.
- Avatar del jugador que se desplaza hacia la habitación elegida y realiza animaciones breves al completar sus tareas.
- Avatares 3D de los integrantes activos en la vista general, con nombre y estado: hechas hoy, pendientes hoy y atrasadas.
- Al tocar un avatar, se ven sus tareas y se resaltan las habitaciones donde tiene pendientes.
- Indicadores de tareas pendientes por ambiente, separados en propias y del hogar.
- Al entrar en una habitación, objetos que representan sus tareas y tarjetas con avatar del responsable, fecha, estado y acciones.
- Sección «Hechas hoy» en cada habitación para ver lo completado después de que desaparece el objeto.
- Filtros «Mis tareas» y «Todo el hogar» dentro de cada habitación.
- Sección «Próximamente» con los turnos de esa habitación para los siguientes siete días.
- Lista general accesible desde el menú para consultar todas las habitaciones.
- Aviso de intercambios por responder.
- Habitación sin pendientes despejada y con un mensaje breve.

### Configuración del hogar

- Nombre del hogar, zona horaria e integrantes.
- Invitación mediante código revocable que vence a los siete días.
- Creación y edición de tareas; opción de pausarlas.
- Selección y orden de los participantes de cada rotación.

### Historial e intercambios

- Registro cronológico de tareas completadas, con fecha y persona que las hizo.
- Solicitudes de intercambio pendientes, aceptadas, rechazadas o canceladas.
- Sin rankings ni puntuaciones entre integrantes.

## Alcance funcional

### Hogar e integrantes

- Un hogar activo por usuario en el MVP.
- Acceso mediante una clave personal generada al crear el perfil, sin correo electrónico. La sesión se conserva durante 30 días.
- Hasta seis integrantes, con nombre visible, color identificador y un avatar 3D simple.
- La persona creadora administra el hogar, las invitaciones y las tareas.
- Los demás integrantes consultan el hogar, completan sus tareas y gestionan sus intercambios.
- Una invitación requiere un perfil con sesión iniciada y deja de permitir ingresos si se revoca, vence o se alcanza el límite de integrantes.
- El hogar puede configurarse con una sola persona, pero la rotación compartida requiere al menos dos.
- Quitar integrantes y transferir la administración quedan fuera de esta primera versión.

### Tareas recurrentes

Cada tarea tiene:

- Título, por ejemplo «Sacar la basura».
- Habitación y un icono de un catálogo pequeño.
- Frecuencia diaria o semanal.
- Primera fecha de vencimiento; en tareas semanales determina el día de la semana.
- Participantes y orden de rotación.
- Estado activo o pausado.

Se ofrecen plantillas editables: sacar la basura, lavar los platos, limpiar el baño, barrer la zona común y ordenar el dormitorio. Las plantillas solo se agregan si el usuario las elige.

No hay horas límite configurables. Una tarea vence al terminar su fecha en la zona horaria del hogar y aparece como atrasada al día siguiente.

### Rotación automática

- Cada tarea tiene su propia cola circular de participantes.
- La primera ocurrencia corresponde al primer integrante de la lista; cada nueva ocurrencia avanza una posición.
- La asignación depende de la secuencia de ocurrencias, no de quién termina primero ni de cuándo abre la aplicación.
- Una tarea diaria genera una ocurrencia por fecha y una semanal cada siete días desde la primera fecha.
- Las ocurrencias atrasadas conservan responsable y fecha. Las siguientes se generan según el calendario aunque haya pendientes anteriores.
- La interfaz agrupa atrasos de una misma tarea para evitar saturar la escena, pero permite resolver cada ocurrencia por separado.
- El sistema materializa las ocurrencias vencidas y las de los próximos siete días sin duplicarlas. Debe recuperar las fechas omitidas si nadie abrió la aplicación durante un tiempo.
- Editar participantes o frecuencia afecta solo a ocurrencias aún no generadas. La interfaz indica desde qué fecha aplica el cambio; la rotación reinicia con el primer participante desde esa fecha.
- Pausar una tarea detiene la generación de nuevas ocurrencias; conserva las existentes y el historial. Al reactivarla, se elige una nueva primera fecha sin recuperar el período pausado.

### Completar tareas

- Solo el responsable actual puede completar su ocurrencia.
- Se registra quién la completó y cuándo.
- Una acción repetida o dos clics simultáneos no duplican el registro.
- Se puede deshacer durante diez segundos para corregir un toque accidental; la ocurrencia vuelve a pendiente y la reversión queda registrada.
- La animación de finalización se ejecuta después de confirmar que el cambio fue guardado.

### Intercambiar turnos

Para el MVP, un intercambio significa cambiar dos ocurrencias concretas entre dos personas.

1. El usuario elige una ocurrencia pendiente propia.
2. Selecciona una ocurrencia pendiente de otro integrante y envía la propuesta.
3. La otra persona puede aceptarla o rechazarla; quien la envió puede cancelarla mientras siga pendiente.
4. Al aceptar, se intercambian los responsables de ambas ocurrencias en una única operación.

Reglas:

- Ambos integrantes deben estar habilitados como participantes de las dos tareas.
- Solo se pueden intercambiar ocurrencias pendientes, incluidas las atrasadas y las próximas ya generadas.
- Una ocurrencia puede formar parte de una sola solicitud pendiente a la vez.
- Si alguna ocurrencia se completa o cambia de responsable, la solicitud deja de ser válida.
- El servidor vuelve a comprobar estas condiciones al aceptar.
- El intercambio queda registrado y no modifica las rotaciones futuras.
- Las solicitudes se muestran dentro de la aplicación; no se requieren notificaciones push ni correos adicionales.

Ejemplo: Ana tiene que limpiar el baño el sábado y Bruno debe sacar la basura el viernes. Ana propone intercambiar esas dos tareas. Cuando Bruno acepta, cambian los responsables de esas ocurrencias; la semana siguiente continúa la rotación original.

## Experiencia de juego 3D

La casa será una escena pequeña de estilo ilustrado, con vista isométrica y geometrías simples. No se necesita reproducir la vivienda real. El ciclo del juego es **explorar una habitación → descubrir una tarea → hacerla en la vida real → confirmarla → ver cómo cambia la habitación**.

- Cocina: platos o bolsa de basura.
- Baño: esponja o cepillo.
- Dormitorio: ropa o una caja para ordenar.
- Zona común: escoba u objetos sobre una mesa.

La casa indica cuántas tareas pendientes hay en cada ambiente. En la vista general, los avatares de quienes viven allí muestran cuántas tareas de hoy hicieron, cuáles siguen pendientes y si tienen atrasadas. Seleccionar un avatar resalta las habitaciones donde tiene tareas. Al entrar en una habitación, se ven sus objetos de tareas y el responsable de cada una. Al completar una tarea, su objeto se reduce y desaparece suavemente; la sección «Hechas hoy» conserva el registro visible. Si un objeto representa varias ocurrencias pendientes, disminuye el contador y permanece hasta resolverlas.

Los turnos futuros de cada ambiente aparecen en la sección «Próximamente» de esa habitación; los objetos representan las tareas de hoy y las atrasadas. Los detalles se consultan con clic o toque, sin depender de pasar el cursor. El estado de la habitación mejora visualmente a medida que se resuelven sus pendientes; la vista general refleja qué ambientes están al día.

La casa debe permitir elegir habitaciones y restablecer la cámara. El avatar propio camina por rutas definidas hacia la habitación seleccionada; la cámara lo sigue. Los demás avatares son figuras simples con nombre y color que resumen el progreso, sin representar la ubicación real de esas personas. Al confirmar una tarea, el avatar propio realiza una animación contextual breve, como recoger la bolsa de basura. No se necesita física ni movimiento libre de personajes. Las animaciones respetan la preferencia de movimiento reducido.

Interactuar con un objeto abre la información de la tarea. La finalización solo se registra cuando su responsable pulsa «Ya la hice» después de realizarla fuera del juego. Un clic accidental sobre el objeto no marca la tarea como hecha. El progreso visual sigue los datos guardados en el servidor.

Todas las acciones también están disponibles mediante teclado y en la lista general. El responsable y el estado se indican con texto además de color. Si WebGL no está disponible, el flujo completo funciona desde una vista de habitaciones en 2D y sus listas de tareas.

## Datos mínimos

| Entidad | Datos principales |
| --- | --- |
| Hogar | Identificador, nombre, zona horaria y administrador |
| Integrante | Usuario autenticado, hogar, nombre, color y variante de avatar |
| Acceso | Clave personal con hash guardado y sesiones con vencimiento |
| Invitación | Hogar, hash del código, vencimiento y estado de revocación |
| Tarea | Título, habitación, icono, frecuencia, fecha inicial, participantes ordenados y estado |
| Ocurrencia | Tarea, fecha, índice de rotación, responsable original, responsable actual, estado y finalización |
| Intercambio | Dos ocurrencias, solicitante, destinatario, estado y fechas |
| Evento de historial | Acción, actor, ocurrencia o intercambio y fecha |

La combinación de tarea y fecha identifica de forma única cada ocurrencia. Las operaciones que completan tareas o aceptan intercambios deben ser consistentes entre dispositivos.

## Dirección técnica

- **React + TypeScript + Vite** para el cliente del juego, la navegación y los paneles de tareas.
- **Three.js con React Three Fiber y Drei** para la casa, los avatares, las interacciones y las animaciones.
- **CSS** para paneles, formularios y diseño adaptable.
- **Hono + TypeScript en Cloudflare Workers** como API pública: sesiones, hogares, invitaciones, tareas, rotaciones, intercambios y permisos.
- **Cloudflare D1** como base de datos SQL del hogar, integrantes, tareas, ocurrencias, intercambios e historial.
- El mismo Worker accede a D1 mediante un binding, sin otra API entre ambos.
- Acceso por clave personal y unión por código de casa; el Worker gestiona usuarios, sesiones y límites de intentos. No se requiere proveedor de correo.
- Operaciones atómicas de datos para generar ocurrencias y aceptar intercambios, con condiciones que impidan aplicar acciones duplicadas o vencidas.
- Actualización de datos al abrir o volver a la aplicación y después de cada acción; la sincronización instantánea queda fuera del MVP.

El recorrido de datos es **navegador → API Hono en un Worker → D1**. La lógica de tareas y rotaciones será independiente de la escena 3D. El MVP requiere conexión; si una operación falla, la interfaz informa el error y permite reintentar sin mostrarla como completada.

El navegador no accede directamente a D1. El Worker comprueba la identidad, la pertenencia al hogar y los permisos antes de cada operación. Conocer un identificador no concede acceso.

Este stack es una propuesta de implementación, no una lista de dependencias ya instaladas.

## Despliegue en Cloudflare

La propuesta es publicar el cliente con Workers Static Assets y la API Hono en el mismo Worker, con Cloudflare D1 para persistencia y entornos separados de pruebas y producción. El acceso usa claves personales y códigos de casa, sin proveedor de correo. R2 queda como componente opcional.

El análisis, las decisiones de arquitectura, el plan de publicación y la recuperación están documentados en [la propuesta de infraestructura](docs/INFRAESTRUCTURA.md). La infraestructura todavía no está provisionada.

Las credenciales se configuran localmente en `.env.local`, excluido de Git, o mediante secretos del entorno de despliegue. `.env.example` documenta únicamente los nombres de las variables, sin valores. Nunca incluir secretos en el frontend ni usar el prefijo `VITE_` para ellos.

## Estado del código y desarrollo local

El código está organizado en [`frontend/`](frontend/) y [`backend/`](backend/). La primera migración de D1 define `users`, `access_keys`, `sessions`, `auth_rate_limits`, `homes`, `home_members` y `home_invites`. La lógica de tareas todavía no tiene tablas ni endpoints: se implementará en los siguientes módulos.

```bash
npm install
npm run db:migrate:local
npm run dev
```

El entorno local usa una base D1 simulada. Para desplegar, se debe crear la base D1 real, reemplazar el `database_id` de ejemplo en `wrangler.jsonc`, aplicar las migraciones remotas y publicar el Worker. Ninguna clave personal ni código de casa se guarda en texto legible: solo se almacenan sus hashes. La clave personal se muestra una vez al crear el perfil; si se pierde y la sesión vence, esta primera versión no puede recuperar la cuenta.

## Fuera del MVP

- Varios hogares por usuario.
- Aplicaciones nativas y funcionamiento sin conexión.
- Chat, comentarios, archivos o fotos como comprobante.
- Minijuegos por tarea, física, combate, monedas y niveles. El juego inicial consiste en recorrer, interactuar y transformar visualmente la casa al registrar tareas reales.
- Notificaciones push, recordatorios externos e integraciones con calendarios.
- Puntos, premios, castigos, rankings o medición de productividad personal.
- Reparto según esfuerzo, disponibilidad, vacaciones o inteligencia artificial.
- Frecuencias mensuales, intervalos personalizados y tareas de una sola vez.
- Transferir una tarea sin intercambio, o intercambiar cadenas de más de dos turnos.
- Editor detallado de casas y avatares, y decoración desbloqueable.
- Compras compartidas, gastos, pagos o suscripciones.

## Criterios de aceptación

- Dos personas pueden unirse al mismo hogar y consultar los mismos pendientes desde distintos dispositivos.
- Un usuario ajeno al hogar no puede leer ni modificar sus datos.
- Una tarea diaria o semanal genera las ocurrencias esperadas según la zona horaria, sin duplicados.
- La rotación respeta el orden configurado y mantiene los responsables de las ocurrencias atrasadas.
- Completar una tarea actualiza la lista, la escena y el historial una sola vez.
- Elegir una habitación mueve al avatar propio hasta ella; sus objetos permiten abrir tareas y solo «Ya la hice» registra una finalización.
- La habitación refleja visualmente el progreso después de guardar una tarea y el cambio persiste al volver a entrar.
- Cada avatar muestra las tareas de hoy completadas y pendientes, más los atrasos de su integrante; si no tiene tareas hoy, indica «Sin tareas hoy».
- Al tocar un avatar se destacan las habitaciones con tareas pendientes de esa persona.
- Una propuesta de intercambio no cambia responsables hasta que el destinatario la acepta.
- Aceptar un intercambio válido cambia ambas asignaciones juntas y conserva la rotación futura.
- Un intercambio inválido o ya resuelto no puede aplicarse nuevamente.
- Los estados vacíos, errores de conexión y solicitudes pendientes tienen mensajes claros.
- El flujo funciona en móvil, con teclado, sin animaciones y sin soporte 3D.

## Validación de producto

Probar el MVP con parejas o compañeros de vivienda durante una semana. Observar si pueden configurar tareas sin ayuda, entender quién sigue en la rotación y acordar un intercambio. Consultar si tuvieron que recordar menos veces las tareas a los demás y si volvieron a usar la aplicación durante la semana.

También evaluar si los objetos de la casa ayudan a encontrar pendientes y si la acumulación de atrasos resulta comprensible. Esta validación inicial puede realizarse mediante observación y entrevistas, sin incorporar analítica al MVP.

## Orden de implementación

1. Autenticación, hogar e invitaciones.
2. Configuración de tareas, generación de ocurrencias y rotación.
3. Lista de pendientes, finalización e historial.
4. Solicitudes y aceptación de intercambios.
5. Casa 3D, movimiento guiado del avatar y objetos conectados a los mismos datos.
6. Reacciones visuales de las habitaciones, accesibilidad y ajustes de uso en móvil.

El MVP estará completo cuando un hogar pueda coordinar sus tareas de principio a fin y se cumplan los criterios de aceptación anteriores.
