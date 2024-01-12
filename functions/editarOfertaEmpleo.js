
exports = async function (request, response) {
  try {
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    await context.functions.execute("middlewareVerificarToken", request.headers, response)

    const payload = await validate(request)

    const collectionOfertasEmpleo = context.functions.execute("getCollectionInstance", "ofertas-empleo")
    const { modifiedCount } = await collectionOfertasEmpleo.updateOne({ _id: payload.documentId }, {
      $set: payload.document
    })

    if(!modifiedCount) 
      throw new Error ('Ocurrió un error y no se pudo modificar la oferta de empleo');

    context.functions.execute('handlerResponse', response, {
      modificado: true,
    });
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
}

const validate = async (request) => {
  const body = JSON.parse(request.body.text())
  const moment = require("moment")
  const jwtConfig = context.values.get("jwt_config")

  if(!body.ofertaId && !body._id) throw new Error("El id de la Oferta de Empleo es requerido")

  const documentId = BSON.ObjectId(body.ofertaId || body._id) 
  const bodyOferta = await context.functions.execute("validarOfertaEmpleo", body)
  
  const sessionUser = request.headers?.[jwtConfig.headerUser]

  return {
    documentId: documentId,
    document: {
      ...bodyOferta,
      actualizadoPor: sessionUser?._id,
      fechaModificacion: moment().toDate(),
    }
  }
}