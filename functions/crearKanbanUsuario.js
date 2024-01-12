exports = async function (request, response) {
  try {
    await context.functions.execute(
      "middlewareVerificarOrigenClientId",
      request,
      response
    );
    await context.functions.execute(
      "middlewareVerificarToken",
      request.headers,
      response
    );

    const payload = await validate(request)

    const collectionKanban = context.functions.execute("getCollectionInstance", "kanban-usuarios")

    const { insertedId } = await collectionKanban.insertOne(payload)

    if(!insertedId) throw new Error("Ocurrió un error creando su configuración kanban")

    const kanbanUsuario = await collectionKanban.findOne({ _id: insertedId })

    context.functions.execute("handlerResponse", response, kanbanUsuario);
  } catch (err) {
    context.functions.execute(
      "handlerResponse",
      response,
      null,
      400,
      false,
      err.message
    );
  }
}

const validate = async (request) => {
  const body = JSON.parse(request.body.text())
  const moment = require("moment")
  const jwtConfig = context.values.get("jwt_config")
  
  const sessionUser = request.headers?.[jwtConfig.headerUser]

  if(!body.ofertaId) throw new Error("El ID de la oferta es requerido")

  const existe = await context.functions.execute("obtenerDocumentoPorQuery", {
    query: {
      usuario: sessionUser._id,
      oferta: BSON.ObjectId(body.ofertaId),
      deleted: { $ne: false }
    },
    collectionName: 'kanban-usuarios'
  })

  if(existe) throw new Error("No se pudo crear, porque ya existe una configuración para tu cuenta.")

  return {
    usuario: sessionUser._id,
    oferta: BSON.ObjectId(body.ofertaId),
    fechaCreacion: moment().toDate(),
    estados: []
  }
}