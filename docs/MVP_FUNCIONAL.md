> Acceso actualizado: registro y login con usuario y contraseña, sin correo. Las referencias a claves personales en el diseño inicial de abajo solo aplican a la transición de cuentas anteriores; el flujo actual está documentado en el README. Las invitaciones por código permanecen iguales.

# Te Toca — definición funcional del MVP

## Qué tiene que lograr el usuario

Una persona crea una casa, invita a quienes viven con ella y configura tareas que se repiten. En este juego de navegador recorre una casa 3D con su avatar, ve a los demás integrantes y entra a una habitación para descubrir qué hay que hacer allí. Cuando completa una tarea real, la confirma y la habitación cambia. El hogar puede consultar lo realizado.

El producto se organiza alrededor de una **ocurrencia**: una tarea concreta en una fecha concreta. Por ejemplo, «limpiar el baño el sábado 3» es una ocurrencia de la tarea recurrente «limpiar el baño». Completarla o intercambiarla no altera por sí solo las fechas ni los responsables de las ocurrencias posteriores.

## Alcance inicial

- Un hogar por cuenta, pensado para 2 a 6 integrantes. Puede tener una sola persona mientras se aceptan las invitaciones.
- Cuatro habitaciones predefinidas: cocina, baño, dormitorio y zona común.
- Un avatar 3D personalizable por integrante: piel, pelo, peinado, ropa y anteojos. Presencia en tiempo real y habitación visitada dentro del juego.
- Tareas diarias o semanales, con una persona responsable en cada fecha.
- Rotación circular entre los participantes seleccionados para cada tarea.
- Intercambio de dos ocurrencias pendientes, sujeto a aceptación.
- Historial de tareas completadas e intercambios.
- Aplicación web adaptable a móvil y escritorio.

La casa 3D permite un recorrido guiado entre habitaciones mediante clic, toque o controles visibles. El avatar propio camina por rutas definidas y la cámara lo acompaña. Los avatares de las otras personas conectadas muestran su progreso y caminan a la habitación que seleccionan en el juego. La lista distingue conexión activa, pestaña ausente y desconexión.

## Flujo completo

```text
Entrar → Crear casa → Invitar integrantes → Crear tareas
       → Ver integrantes y habitaciones → Entrar a una habitación → Ver sus tareas
       → Completar / intercambiar → Consultar historial
```

Una persona invitada sigue este flujo:

```text
Recibir código de casa → Crear perfil o entrar con clave personal
                    → Ingresar código → Entrar a una habitación y ver sus tareas
```

## Componentes funcionales

### 1. Acceso

**Qué hace:** identifica a cada persona para mantener sus acciones y mostrarle solo la casa a la que pertenece.

- La primera vez, la persona elige un nombre visible y recibe una clave personal aleatoria. Debe guardarla: se muestra una sola vez.
- Quien vuelve desde otro dispositivo entra con esa clave personal, sin correo ni contraseña.
- La sesión se conserva durante 30 días al volver a abrir la aplicación.
- Si no tiene casa, puede crear una o elegir «Me invitaron» e ingresar un código de casa válido.
- Si tiene casa, entra directamente a la vista principal.
- Puede cerrar sesión.

**Estados:** clave personal inválida, demasiados intentos, error al entrar. La recuperación de una clave perdida queda fuera de esta primera versión.

### 2. Casa e integrantes

**Qué hace:** crea el espacio compartido y controla quién puede entrar.

- La persona creadora indica nombre de la casa y zona horaria.
- Se crea como administradora y ve una casa vacía con la acción «Agregar primera tarea».
- Puede generar un código de ocho caracteres, compartirlo por el medio que prefiera y regenerarlo para invalidar el anterior. El código vence a los siete días.
- Al ingresar un código válido, el invitado pasa a ser integrante activo y aparece en la casa.
- Cada integrante tiene un avatar 3D. Desde «Mi personaje» puede elegir piel, pelo, peinado, remera, pantalón y anteojos, previsualizarlo y guardar. El cambio se comparte con los demás integrantes.
- La administradora puede copiar el código recién generado o revocarlo al generar uno nuevo.
- Se muestran los integrantes activos. No se crean participantes pendientes hasta que ingresan con el código.
- Solo los integrantes activos pueden formar parte de una rotación y asumir tareas.
- Una cuenta no puede aceptar una invitación de otra casa mientras pertenezca a una.

Todos los integrantes pueden crear y asignar tareas dentro de su casa. El administrador gestiona invitaciones y pausas de rutinas. Cada persona completa las propias; el flujo de intercambios sigue pendiente de implementación.

**Estados:** código inválido, vencido o revocado; cupo de seis integrantes alcanzado; usuario ya integrante de una casa.

### 3. Casa 3D y recorrido

**Qué hace:** organiza las tareas espacialmente. La habitación es la pantalla donde se consultan y resuelven sus pendientes.

- La vista inicial muestra una casa abierta con las cuatro habitaciones.
- Los avatares de los integrantes conectados aparecen en la casa y se mueven a la habitación que visitan. Cada uno muestra su nombre, estado de conexión y tareas de hoy completadas, pendientes y atrasadas. Las personas desconectadas siguen disponibles en el listado.
- Al seleccionar un avatar, se abre una tarjeta con sus tareas de hoy, las atrasadas y las hechas hoy; además, se resaltan las habitaciones donde tiene pendientes.
- Cuando alguien completa una tarea, su indicador y la habitación correspondiente se actualizan para todos los integrantes al volver a consultar los datos.
- Cada habitación indica cuántas tareas pendientes tiene el integrante y cuántas tiene el hogar. Así se sabe adónde ir antes de entrar.
- El usuario selecciona una habitación; su avatar camina hacia ella y la cámara lo acompaña. Allí ve el nombre del ambiente, sus tareas de hoy y las atrasadas, y quién es responsable de cada una.
- Las tareas se representan como objetos o marcadores dentro de la habitación. Al tocar uno se abre una tarjeta con nombre, fecha, responsable y acciones.
- Si hay varias ocurrencias de la misma tarea, el marcador muestra un contador y la tarjeta permite verlas por separado.
- Cada marcador muestra el avatar o nombre de su responsable. La sección «Hechas hoy» de la habitación permite comprobar qué se completó y quién lo hizo, aunque el objeto haya desaparecido.
- Los próximos turnos de esa habitación aparecen en una sección plegada llamada «Próximamente», dentro de la misma vista.
- Desde la habitación se puede agregar una tarea nueva; el ambiente queda preseleccionado en el formulario.
- Al tocar un objeto se abre el detalle. Solo «Ya la hice» registra una tarea que la persona realizó fuera del juego.
- Después de guardar la finalización, el avatar hace una animación breve, el objeto se ordena o desaparece y la habitación actualiza su aspecto y su número de pendientes.
- Botones visibles permiten volver a la vista general y pasar a otra habitación.
- Si la habitación está al día, se muestra despejada con el mensaje «Por acá está todo listo».

La lista general se accede desde el menú y sirve para revisar todo el hogar de una vez. La misma tarjeta y acciones de cada tarea están disponibles allí y en una vista sin 3D para accesibilidad o fallas de WebGL.

**Regla del indicador personal:** «Hechas hoy» cuenta las ocurrencias con fecha de hoy que la persona completó; «Pendientes hoy» cuenta las que tiene asignadas hoy y siguen abiertas; «Atrasadas» cuenta sus ocurrencias abiertas de fechas anteriores. Si no tiene asignaciones hoy, el avatar dice «Sin tareas hoy», no «Todo hecho». Las tareas futuras no afectan ese indicador.

**Límite visual:** tipos de ambiente, objetos y avatares de un catálogo; se pueden crear varios ambientes del mismo tipo; no se modela la vivienda real ni se representan movimientos reales de las otras personas. La escena respeta movimiento reducido. El ciclo jugable del MVP es explorar, descubrir una tarea, hacerla en la vida real y ver la casa transformarse al registrarla.

### 4. Crear y administrar tareas

**Qué hace:** define qué se hace, dónde, cuándo y entre quiénes rota.

Formulario mínimo:

| Campo | Regla |
| --- | --- |
| Nombre | Obligatorio; por ejemplo, «Sacar la basura» |
| Habitación | Una de las cuatro disponibles |
| Icono | Uno de un pequeño catálogo, con opción sugerida según la tarea |
| Frecuencia | Diaria o semanal |
| Primera fecha | Define el inicio; en la semanal también define el día de la semana |
| Participantes | Uno o más integrantes activos, en el orden de rotación |

- Cualquier integrante puede crear y asignar tareas; la administradora puede pausarlas. La edición sigue pendiente.
- Se pueden usar plantillas editables para las tareas comunes, sin agregarlas automáticamente.
- Antes de guardar se muestra una vista previa de los tres turnos siguientes.
- Los cambios de frecuencia o participantes se aplican a las próximas ocurrencias aún no generadas. Las existentes conservan su asignación.
- Al reactivar una tarea pausada se elige una nueva primera fecha.

**Estados:** falta un dato obligatorio, no hay integrantes activos para asignar, tarea pausada.

### 5. Asignación automática y pendientes

**Qué hace:** determina a quién le corresponde cada ocurrencia.

- La primera fecha se asigna al primer participante de la rotación; cada nueva fecha avanza al siguiente y vuelve al primero al terminar la lista.
- La rotación de cada tarea es independiente de las otras.
- El calendario determina los turnos aunque una tarea anterior esté atrasada o alguien la termine tarde.
- Se preparan las ocurrencias de hoy, las atrasadas y las de los próximos siete días, sin duplicados.
- Si nadie usa la app durante varios días, los pendientes omitidos aparecen al volver.
- Una ocurrencia vencida que sigue abierta aparece como «Atrasada» con su fecha original.

Dentro de cada habitación se puede alternar entre **Mis tareas** y **Todas**. Las ocurrencias se muestran primero por atraso y luego por fecha. La lista general aplica el mismo orden e incluye la habitación de cada tarea.

### 6. Completar tareas

**Qué hace:** registra que la persona responsable terminó una ocurrencia.

- El responsable abre el detalle y pulsa «Marcar como hecha».
- La acción guarda quién la completó y cuándo, y actualiza casa, lista e historial.
- Se ofrece «Deshacer» durante diez segundos para corregir un toque accidental.
- Pulsar dos veces o actuar desde dos dispositivos no produce dos finalizaciones.
- Una persona que no es responsable puede ver la tarea, pero no completarla.

### 7. Intercambiar turnos

**Qué hace:** permite acordar un cambio concreto cuando dos integrantes necesitan reorganizarse.

- Desde una ocurrencia propia pendiente, el usuario elige «Proponer intercambio».
- Selecciona una ocurrencia pendiente de otra persona. Ambos deben participar en la rotación de las dos tareas.
- La otra persona recibe la solicitud dentro de la app y puede aceptarla o rechazarla.
- El solicitante puede cancelarla antes de la respuesta.
- Al aceptar, ambas ocurrencias cambian de responsable juntas. La rotación de fechas futuras sigue igual.
- Si alguna de las dos se completa o cambia mientras la solicitud está pendiente, la solicitud caduca y no se puede aceptar.
- Ninguna ocurrencia puede estar en dos solicitudes pendientes al mismo tiempo.

**Estado visible:** propuesta enviada, recibida, aceptada, rechazada, cancelada o caducada.

### 8. Historial

**Qué hace:** permite reconstruir lo que ocurrió sin generar una competencia entre integrantes.

- Lista cronológica de tareas completadas: tarea, fecha prevista, persona que la hizo y fecha real.
- Registro de intercambios aceptados, con ambas personas y tareas involucradas.
- Registro de deshacer una finalización.
- Filtros sencillos por integrante y mes.
- Puntaje por persona y total de la casa: de 5 a 100 puntos por tarea, sumados al completarla y revertidos al deshacer. Los retos no descuentan puntos.

## Pantallas y elementos de interfaz

| Pantalla | Elementos principales |
| --- | --- |
| Acceso | Crear perfil con nombre, mostrar clave personal una vez, volver a entrar con la clave |
| Crear casa | Nombre de la casa, zona horaria, confirmación |
| Integrantes | Lista de activos y código de casa generado por quien administra |
| Inicio | Casa 3D, avatar propio, avatares y progreso de integrantes, pendientes por habitación y acceso a cada una |
| Habitación | Objetos de tareas, responsables con su avatar, tarjetas con acciones, hechas hoy y próximas tareas |
| Detalle de tarea | Responsable, fecha, estado, completar, proponer intercambio |
| Administrar tareas | Listado, plantillas, formulario, vista previa de rotación, pausar |
| Intercambios | Recibidos, enviados y respuesta a una propuesta |
| Historial | Actividad cronológica y filtros |

En móvil y escritorio, se entra primero a la casa. Al elegir una habitación se muestra su escena y sus tareas sin salir de ella; en móvil, las tarjetas pueden abrirse sobre la escena. La lista general queda en el menú para quien quiera ver todos los pendientes juntos.

## Reglas comunes

- Cada usuario solo puede ver y modificar datos de su hogar.
- Las fechas se interpretan en la zona horaria elegida para la casa.
- Ninguna operación aparece como completada antes de guardarse correctamente.
- Se confirma antes de pausar una tarea o revocar una invitación.
- Todos los estados importantes tienen texto; el color y la animación son apoyos visuales.
- Los botones y detalles se pueden usar con teclado, además de clic y toque.

## Base de datos y API

- La base de datos del MVP es **Cloudflare D1**. Guarda hogares, integrantes, invitaciones, tareas, ocurrencias, solicitudes de intercambio e historial.
- Una API en **Cloudflare Workers con Hono y TypeScript** recibe las acciones del navegador y accede a D1 mediante un binding. El cliente nunca consulta ni modifica D1 directamente.
- El Worker verifica la sesión, la pertenencia al hogar y los permisos antes de devolver o cambiar datos. D1 no reemplaza esta lógica de autorización.
- El acceso usa una clave personal de alta entropía que se muestra una sola vez. La base solo conserva su hash; la sesión se guarda en una cookie HttpOnly. El Worker limita intentos de entrada y de unión por código.
- El código de casa tiene vencimiento y puede regenerarse. La unión comprueba el código, la capacidad máxima y que el usuario no pertenezca ya a otra casa.
- Completar una tarea o aceptar un intercambio debe guardar los cambios relacionados de forma atómica y comprobar que la ocurrencia sigue pendiente. Así se evitan duplicados y cambios parciales entre dispositivos.
- El esquema se gestionará con migraciones SQL. Cada ocurrencia tendrá una clave única formada por tarea y fecha.

## Qué queda fuera

- Editor detallado de casas, modelos de avatar subidos por usuarios y movimiento libre en primera persona. Se incluyen personalización básica y presencia en tiempo real por habitación.
- Minijuegos por tarea, física, monedas y niveles. La primera mecánica jugable es recorrer habitaciones e interactuar con tareas reales.
- Notificaciones push, recordatorios por correo y chat.
- Tareas mensuales, tareas únicas y horarios límite configurables.
- Sugerencias automáticas según esfuerzo o disponibilidad.
- Varios hogares por cuenta, cambio de administrador y eliminación de integrantes.
- Recuperación de cuentas sin clave personal ni sesión activa.
- Tareas compartidas que requieren varias personas al mismo tiempo.
- Fotos como prueba, premios materiales y descuentos de puntos como castigo.

## Orden recomendado de construcción

1. Acceso, casa e invitaciones.
2. Tareas y rotación con vista previa.
3. Lista de pendientes y finalización.
4. Intercambios e historial.
5. Casa 3D, recorrido guiado del avatar propio, avatares con progreso y reacción visual de las habitaciones.

El paso 3 sirve para comprobar las reglas de tareas y rotación. La experiencia completa del MVP requiere los cinco pasos, incluido el recorrido por las habitaciones.

## Ampliación: tareas en vivo y reacciones

- Crear, completar, deshacer o recordar una tarea emite un evento al canal privado del hogar. Las pantallas conectadas actualizan la lista y el puntaje desde D1.
- El valor de puntos se copia a la ocurrencia al generarla. El tablero incluye el historial completo de tareas completadas; las ocurrencias previas a esta ampliación valen diez puntos.
- «Retar con onda» recuerda una tarea pendiente actual o atrasada de otra persona. Hay un plazo de cinco minutos entre recordatorios de la misma ocurrencia, compartido por toda la casa. El aviso queda disponible al destinatario aunque estuviera desconectado.
- La casa llena la pantalla y los controles flotan sobre el 3D. El panel de tareas comienza cerrado. El HUD muestra casa, conexión, puntos y menú arriba; habitaciones y crear/ver tareas abajo. Personaje, integrantes, historial, rutinas y vista simple se consultan desde el menú.
- Completar muestra salto, giro, brazos levantados, confeti y puntos flotantes. Los objetos tienen reacciones según su tipo; un reto provoca sorpresa y un globo de aviso. Movimiento reducido conserva los mensajes y evita las animaciones.

## Reacciones sobre personajes

Hacer clic en un personaje abre las acciones 😡 enojarme, 🖕 fuck you, 👍 like y ❤️ corazón. El emoji aparece sobre el avatar de quien reacciona y se comparte con los conectados del hogar. Dura unos tres segundos, no modifica puntos y no queda como historial. El menú también permite consultar las tareas del personaje seleccionado.

## Charla temporal

El botón «Charlar» abre un campo de hasta 160 caracteres. Enter o Enviar publica el mensaje por el socket privado del hogar. El texto aparece ocho segundos sobre el avatar del autor y reemplaza su globo anterior. El panel muestra los últimos treinta mensajes recibidos durante la sesión; no guarda historial ni entrega mensajes fuera de línea. La identidad y pertenencia al hogar se validan en el servidor, el texto se renderiza como texto plano y el campo se conserva si el envío falla.

## Ampliación de la casa y gráficos

«Menú → Mi casa» permite a la administración agregar ambientes, ponerles nombre, renombrarlos y eliminar los que no tengan tareas. Hay cuatro tipos (cocina, baño, dormitorio y living) y un máximo de doce ambientes. La casa se distribuye automáticamente en dos columnas con pasillo central. Las tareas y la presencia apuntan a cada ambiente concreto, por lo que dos baños tienen pendientes independientes.

La escena incorpora pisos con textura, paredes recortadas, aberturas, cortinas, zócalos y muebles detallados. Madera, textiles, cerámicos, piedra, metal y vidrio tienen respuestas diferentes a la luz. Iluminación y mapas de materiales se generan localmente; no se requieren descargas de modelos externos. La vista simple y el flujo de tareas siguen disponibles.
