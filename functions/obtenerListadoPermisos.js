exports = async function (request, response) {
  try {
    await context.functions.execute(
      "middlewareVerificarOrigenClientId",
      request,
      response
    );
    await context.functions.execute("middlewareVerificarToken", request.headers, response)

    const collectionPermisos = context.functions.execute(
      "getCollectionInstance",
      "permisos"
    );

    const permisos = await collectionPermisos.find({}).toArray();
    context.functions.execute("handlerResponse", response, permisos);
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
