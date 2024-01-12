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

    const collectionNivelesPostulacion = context.functions.execute(
      "getCollectionInstance",
      "niveles-postulacion"
    );

    const niveles = await collectionNivelesPostulacion.find({ deleted: { $ne: true } }).toArray()

    context.functions.execute("handlerResponse", response, niveles);
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