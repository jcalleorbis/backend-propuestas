// requiere el id y el token
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
    const { entrevistaId, updateOptions } = await validate(request)

    const collectionEntrevistas = context.functions.execute("getCollectionInstance", "entrevistas")

    const { matchedCount, modifiedCount } = await collectionEntrevistas.updateOne({
      _id: entrevistaId,
    }, updateOptions)

    if (!matchedCount && !modifiedCount) throw new Error("No se pudo cancelar la entrevista, inténtelo nuevamente.");

    context.functions.execute("handlerResponse", response, {
      finalizado: Boolean(modifiedCount)
    });
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
  const moment = require("moment");
  const jwtConfig = context.values.get("jwt_config")

  if(!body.entrevistaId) throw new Error("El id de la entrevista es requerido")

  if(!body.token) throw new Error("El token de actualización es requerido")

  const datosEntrevista = await context.functions.execute("obtenerDocumentoPorQuery", {
    query: {
      _id: BSON.ObjectId(body.entrevistaId)
    },
    collectionName: 'entrevistas'
  })

  if(!datosEntrevista)  throw new Error("El id de la entrevista no existe")

  const { codigo, fechaGeneracion, fechaExpiracion } = await context.functions.execute(
    "decodificarToken",
    body.token
  );

  if (!codigo || !fechaGeneracion || !fechaExpiracion)
    throw new Error("El token de actualización es inválido");

  if(Number(moment().format("x")) >  Number(moment(fechaExpiracion).format("x")))
    throw new Error("Se agotó el tiempo límite de la entrevista.\nVuelve a iniciar la entrevista si quieres marcarla como culminada.");
    
  const sessionUser = request.headers?.[jwtConfig.headerUser];

  const updateOptions = {
    $set: {
      culminado: true,
      culminadoPor: sessionUser?._id
    }
  }

  return {
    entrevistaId: BSON.ObjectId(body.entrevistaId),
    updateOptions,
  }
}