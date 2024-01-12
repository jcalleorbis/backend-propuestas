
exports = async function (request, response)  {
  try {
    const { headers } = request
    // middleware para validar clientID y Origin
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    await context.functions.execute("middlewareVerificarToken", headers, response)
    const jwtConfig = context.values.get("jwt_config");

    context.functions.execute(
      "handlerResponse",
      response,
      {
        ...(headers?.[jwtConfig.headerUser] || {})
      },
      200,
      true,
      "Carga de Perfil completa"
    );
  } catch (error) {
    context.functions.execute(
      "handlerResponse",
      response,
      null,
      400,
      false,
      error.message
    );
  }
}