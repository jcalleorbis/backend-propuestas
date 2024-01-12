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

    const { query } = request;

    if (!query.empresaSku) throw new Error("El id es requerido");

    const collectionEmpresas = context.functions.execute(
      "getCollectionInstance",
      "empresas"
    );

    const empresa = await collectionEmpresas.findOne({
      sku: query.empresaSku,
      deleted: { $ne: true },
    });

    context.functions.execute("handlerResponse", response, empresa);
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
