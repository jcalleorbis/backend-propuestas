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

    const querySearch = getQueries(request);

    const collectionUsuarios = context.functions.execute(
      "getCollectionInstance",
      "usuario"
    );

    const usuarios = await collectionUsuarios.find(querySearch).toArray();
    const usuariosPoblados = await context.functions.execute(
      "populateDocuments",
      {
        results: usuarios,
        populateList: [
          { ref: "perfil", collection: "perfiles" },
          { ref: "creadoPor", collection: "usuario" },
          { ref: "actualizadoPor", collection: "usuario" },
        ],
      }
    );
    context.functions.execute("handlerResponse", response, usuariosPoblados);
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
    deleted: { $ne: true },
  };

  if (sessionUser?.empresa && !sessionUser?.isEmpresaAdmin) {
    // si hay empresa y no es la empresa principal se añade el filtro de empresa
    queries.empresa = sessionUser.empresa;
  }

  return queries;
};
