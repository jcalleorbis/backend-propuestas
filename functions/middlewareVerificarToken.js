// utilizar solo en http endpoints que requieran ser protegidos
exports = async function (headers, response) {
  const jwtConfig = context.values.get("jwt_config");

  const strToken = headers?.["Authorization"]?.[0];

  if (!strToken)
    throw new Error({
      errorMessage:
        "Unauthorized: No tienes autorización para ver los recursos.",
      errorCode: 401,
    });

  const token = strToken.split(" ")?.[1];

  if (!token)
    throw new Error({
      errorMessage:
        "Unauthorized: No tienes autorización para ver los recursos",
      errorCode: 401,
    });

  const payloadToken = await context.functions.execute(
    "decodificarToken",
    token
  );

  if (!payloadToken && !payloadToken?.[jwtConfig.tokenPayloadKey])
    throw new Error({
      errorMessage: "Unauthorized: Token mal formado",
      errorCode: 401,
    });

  // falta validar iat
  const sessionUser = await context.functions.execute(
    "obtenerUsuarioPorId",
    payloadToken[jwtConfig.tokenPayloadKey]
  );

  if (!sessionUser)
    throw new Error({
      errorMessage: "Unauthorized: Usuario Inexistente en el sistema",
      errorCode: 401,
    });

  const userPopulate = await context.functions.execute("populateDocuments", {
    results: sessionUser,
    populateList: [
      {
        ref: "empresa",
        collection: "empresas",
      },
    ],
  });



  headers[jwtConfig.headerUser] = formatUsuario(userPopulate);
};


const formatUsuario = (usuario) => {
  const adminId = context.values.get("recapp_config").perfil_admin_id
  usuario.isEmpresaAdmin =  !Boolean(usuario.empresa) || Boolean(usuario.empresaDoc) && Boolean(usuario.empresaDoc?.esAdmin) || false
  usuario.isSuperAdmin = usuario?.perfil?._id?.toString() == adminId
  return {
    ...usuario
  }
}