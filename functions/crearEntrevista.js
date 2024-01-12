
exports = async function (request, response) {
  try {
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    await context.functions.execute("middlewareVerificarToken", request.headers, response)

    const payload = await validate(request)

    const collectionEntrevistas = context.functions.execute("getCollectionInstance", "entrevistas")
    const { insertedId } = await collectionEntrevistas.insertOne(payload)

    if(!insertedId) 
      throw new Error ('No se pudo culminar la asignación de este candidato a una entrevista Pendiente');

    context.functions.execute('handlerResponse', response, {
      creado: true,
      id: insertedId
    });
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
}

const validate = async (request) => {
  const body = JSON.parse(request.body.text())
  const moment = require("moment")
  const jwtConfig = context.values.get("jwt_config")

  if(!body.postulante) throw new Error("El id del postulante es requerido")

  const empresaId = body.empresa ? BSON.ObjectId(body.empresa) : null

  const existe = await context.functions.execute("obtenerDocumentoPorQuery", {
    query: {
      postulante: BSON.ObjectId(body.postulante),
      empresa: empresaId,
      culminado: { $ne: true },
      deleted: { $ne: true }
    },
    collectionName: 'entrevistas'
  })

  if(existe) throw new Error(`El postulante se encuentra actualmente en la lista de Pendientes por Entrevistar.\nNo puedes volver a añadir este postulante a la lista de Pendientes.`)

  const sessionUser = request.headers?.[jwtConfig.headerUser]

  return {
    postulante: BSON.ObjectId(body.postulante),
    reclutador: null,
    empresa: empresaId,
    todos: body.todos || false,
    culminado: false,
    asignadoPor: sessionUser?._id,
    asignadoPara: body.asignadoPara ? BSON.ObjectId(body.asignadoPara) : null,
    fechaAsignacion: moment().toDate(),
  }
}