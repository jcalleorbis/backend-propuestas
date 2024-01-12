exports = function (request) {
  const jwtConfig = context.values.get("jwt_config");
  const sessionUser = request.headers?.[jwtConfig.headerUser];

  let query = null

  if (sessionUser?.empresa /* && !sessionUser?.isEmpresaAdmin */) {
    // si hay empresa y no es la empresa principal se añade el filtro de empresa
    query = {
      empresa: sessionUser?.empresa
    }
  }

  return query;
}