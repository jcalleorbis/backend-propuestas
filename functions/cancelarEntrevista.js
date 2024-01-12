// requiere el id
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
      cancelado: Boolean(modifiedCount)
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

  const datosEntrevista = await context.functions.execute("obtenerDocumentoPorQuery", {
    query: {
      _id: BSON.ObjectId(body.entrevistaId)
    },
    collectionName: 'entrevistas'
  })

  if(!datosEntrevista)  throw new Error("El id de la entrevista no existe")

  const sessionUser = request.headers?.[jwtConfig.headerUser];

  const historial = {
    fechaCancelacion: moment().toDate(),
    canceladoPor: sessionUser?._id,
    fechaInicioEntrevista: datosEntrevista.fechaInicioEntrevista,
    fechaFinEntrevista: datosEntrevista.fechaFinEntrevista,
    codigoAutorizacion: datosEntrevista.codigoAutorizacion,
    reclutador: datosEntrevista.reclutador,
  }

  const updateOptions = {
    $set: {
      fechaInicioEntrevista: null,
      fechaFinEntrevista: null,
      codigoAutorizacion: null,
      reclutador: null,
    }
  }

  if(datosEntrevista.historial) {
    updateOptions.$push = {
      historial
    }
  } else {
    updateOptions.$set.historial = [historial]
  }

  return {
    entrevistaId: BSON.ObjectId(body.entrevistaId),
    updateOptions,
  }
}