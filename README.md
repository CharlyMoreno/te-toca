# Te Toca

**Una casa compartida, turnos claros.**

Te Toca es un juego de navegador para parejas y compañeros de vivienda que organiza las tareas recurrentes del hogar. Muestra qué hay que hacer, a quién le toca y qué se completó, con turnos automáticos y la posibilidad de intercambiarlos de común acuerdo.

El jugador recorre una pequeña casa 3D con su avatar. En cada habitación encuentra objetos que representan tareas reales. Al confirmar que hizo una, el avatar interactúa con el objeto y el ambiente se ordena. Los avatares de los demás integrantes muestran sus tareas hechas, pendientes y atrasadas.

La definición de pantallas, flujos y reglas de uso está en [la especificación funcional del MVP](docs/MVP_FUNCIONAL.md).
El [modelo de datos](docs/DB_MODEL.md) documenta las migraciones de acceso, hogares, tareas y turnos.

Estado: acceso, hogares, casa 3D, presencia en tiempo real, editor de avatares, ampliación de ambientes, mascotas con tareas, tareas recurrentes, turnos automáticos, finalización, deshacer e historial implementados. Los intercambios y la edición de rutinas siguen pendientes; el MVP completo todavía está en desarrollo. Te Toca es el nombre propuesto; su disponibilidad comercial y de dominio no fue verificada.

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

- Casa 3D con cuatro ambientes iniciales y hasta doce personalizables: cocinas, baños, dormitorios, livings, garajes y jardines con nombres propios.
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
- Puntaje acumulado por integrante y total de la casa, con puntos configurables por tarea.

## Alcance funcional

### Hogar e integrantes

- Un hogar activo por usuario en el MVP.
- Registro y acceso con usuario y contraseña, sin correo electrónico. La sesión se conserva durante 30 días.
- Hasta seis integrantes, con nombre visible, color identificador y un avatar 3D simple.
- La persona creadora administra el hogar, las invitaciones y las pausas de rutinas. Cualquier integrante puede crear tareas y asignarlas a una o varias personas de la casa.
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
- Acceso por usuario y contraseña y unión por código de casa; el Worker gestiona usuarios, sesiones y límites de intentos. No se requiere proveedor de correo.
- Operaciones atómicas de datos para generar ocurrencias y aceptar intercambios, con condiciones que impidan aplicar acciones duplicadas o vencidas.
- **WebSockets + Durable Objects** para presencia y ubicación dentro del juego, con un canal privado por casa. Las mutaciones notifican a los clientes conectados para que actualicen tareas, integrantes y avatares desde la API.

El recorrido de datos es **navegador → API Hono en un Worker → D1**. La lógica de tareas y rotaciones será independiente de la escena 3D. El MVP requiere conexión; si una operación falla, la interfaz informa el error y permite reintentar sin mostrarla como completada.

El navegador no accede directamente a D1. El Worker comprueba la identidad, la pertenencia al hogar y los permisos antes de cada operación. Conocer un identificador no concede acceso.

React, Three.js, React Three Fiber, Drei y Hono ya están instalados. La escena se carga bajo demanda al entrar a una casa.

## Despliegue en Cloudflare

La propuesta es publicar el cliente con Workers Static Assets y la API Hono en el mismo Worker, con Cloudflare D1 para persistencia y entornos separados de pruebas y producción. El acceso usa usuario y contraseña; las invitaciones siguen usando códigos de casa, sin proveedor de correo. R2 queda como componente opcional.

El análisis, las decisiones de arquitectura, el plan de publicación y la recuperación están documentados en [la propuesta de infraestructura](docs/INFRAESTRUCTURA.md). La infraestructura todavía no está provisionada.

Las credenciales se configuran localmente en `.env.local`, excluido de Git, o mediante secretos del entorno de despliegue. `.env.example` documenta únicamente los nombres de las variables, sin valores. Nunca incluir secretos en el frontend ni usar el prefijo `VITE_` para ellos.

## Estado del código y desarrollo local

El código está organizado en [`frontend/`](frontend/) y [`backend/`](backend/). La primera migración de D1 define `users`, `access_keys`, `sessions`, `auth_rate_limits`, `homes`, `home_members` y `home_invites`. La segunda migración, `0002_tasks.sql`, incorpora `tasks`, `task_participants`, `task_occurrences` y `activity_events`. La API `/api/tasks` genera turnos al consultar la casa, conserva atrasos y prepara los próximos siete días.

```bash
npm install
npm run db:migrate:local
npm run dev
```

### Usar la casa 3D

1. Abrí la dirección que imprime Vite al ejecutar `npm run dev`.
2. Entrá con tu usuario y contraseña o creá un perfil y una casa.
3. Usá **Nueva tarea** para elegir habitación, objeto, frecuencia, fecha inicial y participantes de la rotación.
4. Tocá una habitación: la cámara se acerca y tu avatar camina hasta ella. Arrastrá para girar la cámara; usá la rueda o un pellizco para acercar. **Ver toda la casa** restablece la vista.
5. Tocá los objetos para abrir su tarea. **Ya la hice** guarda la finalización, retira el objeto y anima al avatar. Hay diez segundos para deshacer.
6. Elegí un integrante para filtrar sus pendientes; consultá **Hechas**, **Próximas** e **Historial** para ver el resto.

La escena usa modelos geométricos propios, sin descargas de modelos externos. Muestra hasta seis objetos pendientes por habitación; todas las ocurrencias están disponibles en la lista. Los avatares conectados muestran la habitación que visitan en el juego; la lista de integrantes también conserva a quienes están desconectados. Los datos se actualizan por avisos del servidor, al reconectar, al volver a la pestaña y después de cada acción.

**Vista simple** permite usar las habitaciones sin 3D. La navegación por botones y listas funciona con teclado; las animaciones respetan la preferencia de movimiento reducido. La celebración incluye salto, giro, brazos levantados, confeti y puntos flotantes. Los objetos reaccionan según su tipo: burbujas en platos, barrido de escoba, elevación de basura y giro de ropa. Los retos muestran un gesto de sorpresa y un aviso sobre el avatar.

Pausar una rutina detiene la generación de turnos nuevos; los ya generados permanecen. Por ahora no hay edición ni reactivación desde la interfaz.

El entorno local usa una base D1 simulada. Para desplegar, se debe crear la base D1 real, reemplazar el `database_id` de ejemplo en `wrangler.jsonc`, aplicar las migraciones remotas y publicar el Worker. Las contraseñas se guardan como hashes bcrypt con salt; las cookies y los códigos de casa se guardan mediante hashes SHA-256. No hay recuperación por correo en esta versión.

## Casa y ambientes

Desde **Menú → Mi casa**, quien administra puede agregar ambientes de seis tipos: cocina, baño, dormitorio, living, garaje y jardín. Cada ambiente tiene nombre propio, muebles según su tipo, tareas independientes y ubicación dentro del recorrido. Se pueden tener varios baños o dormitorios, hasta un máximo de doce ambientes por casa.

- **Agregar:** elegir tipo y nombre; la casa amplía su distribución automáticamente.
- **Renombrar:** cambia el nombre sin afectar tareas, puntajes ni historial.
- **Quitar:** solo ambientes sin tareas asociadas, conservando al menos uno. Las tareas pausadas también conservan su ambiente.
- Los demás integrantes ven los cambios por el socket. Todos siguen pudiendo crear tareas en cualquiera de los ambientes existentes.

La distribución usa dos columnas con un pasillo central; todavía no incluye arrastrar paredes, elegir medidas ni varios pisos. Al ampliarla, la cámara general se ajusta y cada ambiente sigue teniendo su vista cercana. El selector inferior permite desplazarse horizontalmente si hay muchos ambientes.

### Gráficos

La escena ahora usa materiales con mapas procedurales de madera, piedra, tela, revoque y cerámicos; distintas rugosidades para metal, vidrio y sanitarios; iluminación ambiental generada localmente, luz cálida, sombras de contacto y tone mapping. No descarga texturas, modelos ni HDR externos.

Se incorporaron zócalos, aberturas y cortinas; cocina con mesada, bacha, grifería, horno y banquetas; baño con mampara, ducha, vanitory y espejo estilizado; dormitorio con placard, cabecera tapizada y lámparas; living con textiles, mesa, biblioteca baja y TV. La casa se presenta como una maqueta arquitectónica abierta, con algunas paredes recortadas para mantener visibles tareas y personajes.

Aplicar `npm run db:migrate:local` incorpora las migraciones pendientes, incluyendo `0006_rooms.sql` y `0007_garden_garage_pets.sql`. Las casas existentes conservan sus cuatro ambientes y sus tareas mediante una migración de referencias. Las nuevas casas reciben la misma distribución inicial.

## Tareas compartidas, puntos y retos

Todos los integrantes pueden crear tareas. Elegir un participante asigna sus turnos a esa persona; elegir varios genera una rotación. La administración conserva el permiso para pausar rutinas y generar invitaciones.

Cada tarea tiene entre **5 y 100 puntos**, con 10 como valor inicial. Al generar una ocurrencia se copia su valor. El tablero **Puntajes** suma todas las ocurrencias completadas por persona, sin limitarse a las visibles en los últimos treinta días. Completar dos veces no duplica puntos; deshacer quita el aporte de esa ocurrencia. La migración asigna 10 puntos también a las tareas y ocurrencias existentes, incluidas las ya completadas.

El socket de la casa entrega eventos `task.created`, `task.completed`, `task.undone` y `task.nudged`. Una tarea nueva muestra un aviso a los conectados y actualiza la lista, los objetos y los próximos turnos, según su fecha. Los puntos y las celebraciones también se comparten. Reconectar recupera los datos actuales desde D1; las animaciones son transitorias y no se reproducen como historial.

**Retar con onda** aparece en pendientes de otra persona con fecha de hoy o anterior. Envía un recordatorio y muestra una reacción sobre el avatar. El servidor impone cinco minutos entre recordatorios de la misma ocurrencia para toda la casa, valida el responsable y rechaza tareas hechas, futuras o ajenas al hogar. Los retos no descuentan puntos. Si el destinatario está desconectado, el aviso queda guardado y aparece en sus pendientes al volver; el avatar temporal se identifica como desconectado.

La casa ocupa el área completa de la pantalla. Una interfaz mínima de juego flota sobre la escena: nombre de casa, conexión, puntos y menú arriba; habitaciones y dos acciones (crear y ver tareas) abajo. **Tareas** abre o cierra el panel, que comienza cerrado en todos los dispositivos. El menú superior reúne personaje, integrantes, puntajes, historial, rutinas y vista simple. La barra inferior sirve para cambiar de habitación; los avatares muestran solo el nombre y su estado de conexión, con detalles al seleccionarlos. Los botones y las listas siguen disponibles en la vista simple y con teclado.

Aplicar `npm run db:migrate:local` incorpora `0004_points_nudges.sql`.

## Registro y login

Solo se piden **usuario y contraseña**. El usuario tiene de 3 a 24 caracteres (letras, números, punto, guion y guion bajo), es único y no distingue mayúsculas. La contraseña tiene de 6 a 64 caracteres, hasta 72 bytes UTF-8, sin reglas de mayúsculas o símbolos ni campo de confirmación. El usuario se usa como nombre visible al crear el perfil.

`user_credentials` guarda el usuario normalizado y un hash **bcrypt con costo 12 y salt aleatorio**. Nunca se devuelve ni se guarda la contraseña original. Se mantienen cookies `HttpOnly`, límites de intentos por IP y usuario y errores genéricos al fallar el login. La implementación utiliza [bcrypt.js](https://github.com/dcodeIO/bcrypt.js); el salt y el factor de trabajo quedan incorporados al hash.

Las cuentas previas conservan todos sus datos. Si tienen una sesión abierta, se les pide elegir credenciales una vez. Si solo conservan su clave personal, el enlace **Tenía una cuenta con clave personal** permite usarla para configurar usuario y contraseña. Al hacerlo se revocan sus claves anteriores. No se asignan contraseñas por defecto.

Aplicar `npm run db:migrate:local` incorpora `0005_password_login.sql`. El Worker usa `nodejs_compat` para la dependencia de hashing. Para producción, contemplar el tiempo de CPU del hashing en el plan de Workers; bcrypt con este costo puede exceder el presupuesto de CPU del plan gratuito. La publicación remota todavía no está configurada.

## Presencia y personajes

**Mi personaje** abre un editor con vista 3D giratoria: seis tonos de piel, cinco peinados (corto, rulos, largo, rodete y sin pelo), siete colores de pelo y remera, cuatro colores de pantalón y anteojos. La apariencia se guarda en D1 al confirmar y se comparte con la casa. Cerrar el editor sin guardar descarta el borrador.

Al entrar, el navegador abre `/api/presence` con su cookie de sesión. El Worker determina el hogar y lo conecta a su instancia `HousePresence` mediante el binding `HOUSE_PRESENCE`. No acepta identidades ni hogares elegidos por el cliente. Los avatares caminan hasta la habitación seleccionada también en las pantallas de los demás. Es presencia dentro del juego, sin geolocalización.

- **En línea:** una pestaña visible mantiene la conexión.
- **Ausente:** la conexión sigue abierta, pero la pestaña está oculta.
- **Desconectado:** no hay conexiones vigentes de ese integrante.
- Una persona con varias pestañas aparece una sola vez; se prioriza la pestaña visible con el movimiento más reciente.
- Al perder red se borra el listado de presencia y se muestra la reconexión. Los latidos son cada veinte segundos; una conexión abandonada se descarta tras setenta segundos, en la siguiente revisión de treinta segundos. Las sesiones se revalidan en esas revisiones.
- Los cambios de tareas y apariencia se guardan primero por HTTP en D1. Después, un aviso por socket hace que los clientes consulten nuevamente los datos autorizados. No se completan tareas mediante mensajes de socket.

### Charlar en la casa

**Charlar**, abajo a la izquierda, abre el chat. Escribí hasta 160 caracteres y presioná Enter o el botón de enviar: el mensaje aparece ocho segundos sobre tu personaje y lo ven todos los conectados de la casa. Un nuevo mensaje de la misma persona reemplaza su globo anterior. El panel conserva los últimos treinta mensajes recibidos durante la sesión, para poder leer a quienes estén fuera del encuadre; no hay historial persistente ni entrega a personas desconectadas.

El servidor obtiene el autor de la sesión del socket y valida su membresía antes de difundir texto plano. No interpreta HTML ni permite elegir otro autor. Hay un intervalo mínimo de 1,5 segundos por conexión. El campo se vacía al recibir la confirmación; si se corta la conexión o falla el envío, conserva el texto. Al mostrarse un mensaje sobre un personaje se ocultan temporalmente sus emojis y globos de reacción para evitar superposiciones. No requiere migraciones nuevas de D1.

### Reacciones de personaje

Al hacer clic en un personaje aparece un menú con **😡 enojarme, 🖕 fuck you, 👍 like y ❤️ corazón**, además de acceso a sus tareas. El emoji elegido flota sobre el avatar de quien lo envía, incluso si hizo clic en otro integrante. Todos los conectados de esa casa ven la reacción durante unos tres segundos. Los personajes siguen sin cambiar su puntaje por reaccionar.

La identidad se obtiene de la sesión del socket, el destinatario se valida dentro del hogar y se aceptan únicamente los cuatro emojis del catálogo. Las reacciones tienen un intervalo mínimo de 1,5 segundos por conexión. Son eventos temporales; no se guardan ni se reproducen al reconectar. Movimiento reducido muestra el emoji sin desplazamiento.

### Configuración

Ejecutá `npm run db:migrate:local` para aplicar `0003_avatars.sql` y reiniciá `npm run dev` si estaba abierto antes de agregar el binding. Wrangler configura el Durable Object local automáticamente. Para publicar, además de las migraciones de D1, el despliegue incluye la migración `v1-house-presence` de `wrangler.jsonc`. La infraestructura remota sigue pendiente de provisionar.

Para usarlo entre dos personas en local, abrí la URL en dos perfiles de navegador (por ejemplo, ventana normal e incógnito), creá dos cuentas y unilas mediante el código de la misma casa. Cada una puede elegir su personaje y habitación. Dos pestañas con la misma cookie representan a la misma persona.

La presencia usa la [API de WebSockets con hibernación de Cloudflare](https://developers.cloudflare.com/durable-objects/best-practices/websockets/). El estado temporal de conexión vive en los attachments del Durable Object; la apariencia persistente vive en D1.

## Fuera del MVP

- Varios hogares por usuario.
- Aplicaciones nativas y funcionamiento sin conexión.
- Comentarios persistentes sobre tareas, archivos o fotos como comprobante. La charla temporal de la casa sí está incluida.
- Minijuegos por tarea, física, combate, monedas y niveles. El juego inicial consiste en recorrer, interactuar y transformar visualmente la casa al registrar tareas reales.
- Notificaciones push, recordatorios externos e integraciones con calendarios.
- Premios materiales, descuentos automáticos de puntos por atrasos y estadísticas de productividad personal. El puntaje lúdico por tareas sí está incluido.
- Reparto según esfuerzo, disponibilidad, vacaciones o inteligencia artificial.
- Frecuencias mensuales, intervalos personalizados y tareas de una sola vez.
- Transferir una tarea sin intercambio, o intercambiar cadenas de más de dos turnos.
- Editor libre de paredes, medidas y pisos, modelos de avatar subidos por usuarios y decoración desbloqueable. La ampliación automática de ambientes y personalización básica del personaje sí están incluidas.
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


## Garaje, jardín y mascotas

- **Menú → Mi casa:** la administración puede agregar un garaje con portón, auto y banco de herramientas, o un jardín abierto con césped, árbol, cantero, banco y sendero. Conservan el límite compartido de doce ambientes y admiten tareas como cualquier habitación. Las casas siguen comenzando con cuatro ambientes; las ampliaciones se agregan desde el editor.
- **Menú → Mascotas:** cualquier integrante puede agregar y personalizar hasta seis perros o gatos, eligiendo nombre, especie y pelaje. Quien administra puede quitar una mascota si nunca tuvo tareas asociadas; las rutinas pausadas también conservan esa referencia.
- Las mascotas recorren las puertas y el corredor, hacen pausas y animan patas, cabeza y cola. Tocarlas abre su lista de tareas; la vista simple ofrece el mismo acceso desde el menú. Con movimiento reducido permanecen quietas.
- **Crear tarea → Asignar a una mascota:** asocia la tarea a su ficha y a un ambiente. Se elige una persona responsable o varias para rotar sus cuidados. Ejemplos: dar de comer, pasear o practicar un truco. El responsable confirma la finalización y recibe los puntos; la mascota nunca completa tareas automáticamente. Deshacer, historial y recordatorios siguen funcionando.
- Altas, personalización y tareas se actualizan por el socket privado del hogar. El paseo se calcula localmente con un recorrido determinista y el reloj de cada dispositivo; no transmite posiciones ni representa movimiento de animales reales. Relojes desajustados pueden mostrar posiciones diferentes.
- `0007_garden_garage_pets.sql` agrega tipos de ambiente, mascotas y la asociación opcional en tareas, conservando las referencias y el historial existentes. Ejecutar `npm run db:migrate:local` antes de levantar esta versión; para un despliegue con D1 remota, aplicar también las migraciones allí.
