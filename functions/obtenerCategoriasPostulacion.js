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

    const collectionCategoriasPostulacion = context.functions.execute(
      "getCollectionInstance",
      "categorias-postulacion"
    );

    const categorias = await collectionCategoriasPostulacion.find({ deleted: { $ne: true } }).toArray()

    context.functions.execute("handlerResponse", response, categorias);
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