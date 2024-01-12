exports = async function (request, response) {
  try {
    await context.functions.execute(
      "middlewareVerificarOrigenClientId",
      request,
      response
    );
    await context.functions.execute("middlewareVerificarToken", request.headers, response)

    const collectionPerfiles = context.functions.execute(
      "getCollectionInstance",
      "perfiles"
    );

    const queries = getQueries(request)
    const perfiles = await collectionPerfiles.find(queries).toArray();
    context.functions.execute("handlerResponse", response, perfiles);
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


const getQueries = (request) => {
  const jwtConfig = context.values.get("jwt_config");
  const sessionUser = request.headers?.[jwtConfig.headerUser];

  const queries = {
    deleted: { $ne: true }
  }

  if (sessionUser?.empresa && !sessionUser?.isEmpresaAdmin) {
    // si hay empresa y no es la empresa principal se añade el filtro de empresa
    queries.esPublico = true
  }

  return queries
}
