# Te Toca

**Una casa compartida, turnos claros.**

Te Toca es una aplicación web para parejas y compañeros de vivienda que organiza las tareas recurrentes del hogar. Muestra qué hay que hacer, a quién le toca y qué se completó, con turnos automáticos y la posibilidad de intercambiarlos de común acuerdo.

Una pequeña casa 3D representa los ambientes. Las tareas pendientes aparecen como objetos dentro de cada habitación y desaparecen con una animación al completarlas.

Estado: definición del MVP; la aplicación todavía no está implementada. Te Toca es el nombre propuesto. Su disponibilidad comercial y de dominio no fue verificada.

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
- Convertir la casa 3D en una forma de navegar los pendientes y reconocer el progreso.

La hipótesis es que una lista compartida con responsables claros reduce las conversaciones repetidas sobre quién debe hacer cada cosa. La rotación reparte turnos por tarea; no garantiza igual esfuerzo total entre personas.

## Objetivo del MVP

Un hogar puede registrar sus integrantes, configurar tareas recurrentes, consultar responsables, completar pendientes y acordar intercambios desde distintos dispositivos. Todo con una casa visual sencilla y una lista equivalente para las acciones cotidianas.

## Flujo principal

1. Una persona inicia sesión, crea un hogar y elige su zona horaria.
2. Comparte un enlace de invitación con los demás integrantes, que se identifican para unirse.
3. Crea tareas indicando habitación, frecuencia, primera fecha y participantes de la rotación.
4. La aplicación asigna el primer turno y muestra las tareas que ya están pendientes.
5. Cada integrante ve sus tareas y las del hogar en la casa 3D o en una lista.
6. Al completar una tarea propia, su objeto desaparece con una animación y la acción queda registrada.
7. La siguiente ocurrencia corresponde al próximo integrante de la rotación.
8. Si necesita cambiar un turno, el integrante propone un intercambio con una tarea de otra persona; el cambio se aplica cuando esta lo acepta.

## Pantallas

### Inicio: nuestra casa

- Casa 3D con cuatro ambientes fijos: cocina, baño, dormitorio y zona común.
- Objetos que representan tareas pendientes, con responsable y estado accesibles al seleccionarlos.
- Filtros «Mis tareas» y «Todo el hogar».
- Lista sincronizada con la escena: tarea, responsable, fecha y acción principal.
- Sección de próximos turnos para los siguientes siete días.
- Aviso de intercambios por responder.
- Estado sin pendientes con una casa despejada y un mensaje breve.

### Configuración del hogar

- Nombre del hogar, zona horaria e integrantes.
- Invitación mediante enlace revocable.
- Creación y edición de tareas; opción de pausarlas.
- Selección y orden de los participantes de cada rotación.

### Historial e intercambios

- Registro cronológico de tareas completadas, con fecha y persona que las hizo.
- Solicitudes de intercambio pendientes, aceptadas, rechazadas o canceladas.
- Sin rankings ni puntuaciones entre integrantes.

## Alcance funcional

### Hogar e integrantes

- Un hogar activo por usuario en el MVP.
- Inicio de sesión por enlace enviado al correo.
- Hasta seis integrantes, con nombre visible y color identificador.
- La persona creadora administra el hogar, las invitaciones y las tareas.
- Los demás integrantes consultan el hogar, completan sus tareas y gestionan sus intercambios.
- Una invitación requiere autenticación y deja de permitir ingresos si se revoca o se alcanza el límite de integrantes.
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

## Experiencia 3D

La casa será una escena pequeña de estilo ilustrado, con vista isométrica y geometrías simples. No se necesita reproducir la vivienda real.

- Cocina: platos o bolsa de basura.
- Baño: esponja o cepillo.
- Dormitorio: ropa o una caja para ordenar.
- Zona común: escoba u objetos sobre una mesa.

Al seleccionar un objeto, se abre el detalle de la tarea. Al completarla, el objeto se reduce y desaparece suavemente. Si representa varias ocurrencias pendientes, disminuye el contador y permanece hasta resolverlas.

Los objetos próximos aún no vencidos se muestran en la lista de próximos turnos; la escena principal representa las tareas de hoy y las atrasadas. Los detalles se consultan con clic o toque, sin depender de pasar el cursor.

La casa debe permitir elegir habitaciones y restablecer la cámara. No incluye movimiento libre de personajes, física ni personalización de muebles. Las animaciones son breves y respetan la preferencia de movimiento reducido.

Todas las acciones también están disponibles en la lista mediante teclado. El responsable y el estado se indican con texto además de color. Si WebGL no está disponible, el flujo completo funciona desde la lista.

## Datos mínimos

| Entidad | Datos principales |
| --- | --- |
| Hogar | Identificador, nombre, zona horaria y administrador |
| Integrante | Usuario autenticado, hogar, nombre y color |
| Invitación | Hogar, token y estado de revocación |
| Tarea | Título, habitación, icono, frecuencia, fecha inicial, participantes ordenados y estado |
| Ocurrencia | Tarea, fecha, índice de rotación, responsable original, responsable actual, estado y finalización |
| Intercambio | Dos ocurrencias, solicitante, destinatario, estado y fechas |
| Evento de historial | Acción, actor, ocurrencia o intercambio y fecha |

La combinación de tarea y fecha identifica de forma única cada ocurrencia. Las operaciones que completan tareas o aceptan intercambios deben ser consistentes entre dispositivos.

## Dirección técnica propuesta

- **React + TypeScript + Vite** para la aplicación web.
- **Three.js con React Three Fiber** para la casa y las animaciones.
- **CSS** para diseño adaptable y transiciones de interfaz.
- **Supabase** como opción inicial para autenticación, PostgreSQL y reglas de acceso por hogar.
- Operaciones de servidor para generar ocurrencias y aceptar intercambios de forma atómica.
- Actualización de datos al abrir o volver a la aplicación y después de cada acción; la sincronización instantánea queda fuera del MVP.

La lógica de tareas y rotaciones será independiente de la escena 3D. Los datos compartidos se guardan en el servidor. El MVP requiere conexión; si una operación falla, la interfaz informa el error y permite reintentar sin mostrarla como completada.

Las credenciales con privilegios de servidor nunca deben incluirse en el cliente. Cada usuario solo puede acceder a los datos de su hogar; conocer un identificador no concede acceso.

Este stack es una propuesta de implementación, no una lista de dependencias ya instaladas.

## Fuera del MVP

- Varios hogares por usuario.
- Aplicaciones nativas y funcionamiento sin conexión.
- Chat, comentarios, archivos o fotos como comprobante.
- Notificaciones push, recordatorios externos e integraciones con calendarios.
- Puntos, premios, castigos, rankings o medición de productividad personal.
- Reparto según esfuerzo, disponibilidad, vacaciones o inteligencia artificial.
- Frecuencias mensuales, intervalos personalizados y tareas de una sola vez.
- Transferir una tarea sin intercambio, o intercambiar cadenas de más de dos turnos.
- Editor de casas, avatares y decoración desbloqueable.
- Compras compartidas, gastos, pagos o suscripciones.

## Criterios de aceptación

- Dos personas pueden unirse al mismo hogar y consultar los mismos pendientes desde distintos dispositivos.
- Un usuario ajeno al hogar no puede leer ni modificar sus datos.
- Una tarea diaria o semanal genera las ocurrencias esperadas según la zona horaria, sin duplicados.
- La rotación respeta el orden configurado y mantiene los responsables de las ocurrencias atrasadas.
- Completar una tarea actualiza la lista, la escena y el historial una sola vez.
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
5. Casa 3D conectada a los mismos datos.
6. Animaciones, accesibilidad y ajustes de uso en móvil.

El MVP estará completo cuando un hogar pueda coordinar sus tareas de principio a fin y se cumplan los criterios de aceptación anteriores.
