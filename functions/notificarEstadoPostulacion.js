exports = async function (request, response) {
  try {

    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    await context.functions.execute("middlewareVerificarToken", request.headers, response)

    const moment = require("moment")
    const recappConfig = context.values.get("recapp_config")
    const { email, nombres, estatus, tituloOferta, postulacionId } = validate(request)
    const account = 'noreply_account'
    const collectionPostulaciones = context.functions.execute("getCollectionInstance", "postulaciones")
    const sended = await context.functions.execute("enviarCorreo", {
      to: email, 
      subject: `Proceso de Selección - ${tituloOferta}`, 
      html: getHtmlNotificacionEstado({
        nombreEquipo: `Equipo ${recappConfig.nombre_app}`,
        nombreEstado: estatus?.descripcion,
        nombres: nombres,
        tituloOferta: tituloOferta
      }),
      account
    })

    if(!sended) throw new Error("Ocurrió un error y no se pudo enviar el mail de cambio de estado")

    await collectionPostulaciones.updateOne({ _id: postulacionId }, {
      $push: {
        historialNotificaciones: {
          estatus,
          fechaEnvio: moment().toDate(),
          enviado: sended
        }
      }
    })

    const message = `El correo de cambio de estado "${estatus?.descripcion}" para el candidato ${nombres} se envió correctamente.`
    context.functions.execute('handlerResponse', response, { sended }, 200, true, message);
  } catch (err) {
     context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
}

const getHtmlNotificacionEstado = ({ nombres, tituloOferta, nombreEstado, nombreEquipo }) => {
  return `
  <div
    style="
      background-color: #eee;
      padding: 20px;
      width: 100%;
      height: 100%;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      box-sizing: border-box;
    "
  >
    <div
      style="
        margin: auto;
        background: #fff;
        padding: 15px 20px;
        box-sizing: border-box;
        max-width: 600px;
      "
    >
      <h4 style="padding: 10px 0">Hola ${nombres},</h4>
      <div style="border-bottom: 1px solid #eee; margin-bottom: 10px;"></div>
      
      <p style="padding: 10px 0; font-size: 14px;">
        <span>Tu proceso de selección para el puesto <b>"${tituloOferta}"</b> continua avanzando y actualmente has sido movido al estado <b>${nombreEstado}</b>
        <br/>Pronto nos estaremos poniendo en contacto contigo.
        <br/><br/>Atentamente, ${nombreEquipo}.
       </span>
      </p>
    </div>
  </div>
`;
}

const validate = (request) => {
  const body = JSON.parse(request.body.text())

  if(!body.postulacionId) throw new Error("El ID de la postulación es requerido")
  if(!body.email) throw new Error("El email de destino es requerido")
  if(!body.nombres) throw new Error("El nombre del candidato es requerido para el mail de notificación") 
  if(!body.estatus) throw new Error("El estado es requerido")
  if(!body.tituloOferta) throw new Error("El título de la oferta es requerido")

  body.estatus = {
    ...body.estatus,
    _id: BSON.ObjectId(body.estatus?._id)
  }
 
  return {
    postulacionId: BSON.ObjectId(body.postulacionId),
    email: body.email,
    nombres: body.nombres,
    estatus: body.estatus,
    tituloOferta: body.tituloOferta
  }
}