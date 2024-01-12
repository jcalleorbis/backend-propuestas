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

    const { entrevistaId, document } = await validate(request)

    const collectionEntrevistas = context.functions.execute("getCollectionInstance", "entrevistas")
    
    const { matchedCount, modifiedCount } = await collectionEntrevistas.updateOne({ _id: entrevistaId }, {
      $set: document
    })
    
    if (!matchedCount && !modifiedCount) throw new Error("No se encontró el pendiente a eliminar");

    context.functions.execute('handlerResponse', response, {
      deleted: Boolean(modifiedCount)
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
};

const validate = async (request) => {
  const { query } = request;
  const moment = require("moment")
  const jwtConfig = context.values.get("jwt_config")

  if (!query.entrevistaId)
    throw new Error("El id de la entrevista es requerido");

  const entrevista = await context.functions.execute(
    "obtenerDocumentoPorQuery",
    {
      query: {
        _id: BSON.ObjectId(query.entrevistaId),
      },
      collectionName: 'entrevistas'
    }
  );

  if (!entrevista) throw new Error("La entrevista no existe");

  const entrevistaEnCurso =
    Boolean(
      entrevista.reclutador && entrevista.codigoAutorizacion && entrevista.fechaFinEntrevista
    ) &&
    Number(moment(entrevista.fechaFinEntrevista).format("x")) >
      Number(moment().format("x"));

  if (entrevistaEnCurso) throw new Error(`No se puede eliminar un pendiente con Entrevista "En Curso"`);

  const sessionUser = request.headers?.[jwtConfig.headerUser]

  return {
    entrevistaId: entrevista._id,
    document: {
      deleted: true,
      fechaEliminacion: moment().toDate(),
      eliminadoPor: sessionUser?._id
    }
  }
};
