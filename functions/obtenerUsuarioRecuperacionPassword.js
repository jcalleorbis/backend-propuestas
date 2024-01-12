exports = async function (request, response) {
  try {
    await context.functions.execute(
      "middlewareVerificarOrigenClientId",
      request,
      response
    );

    const collectionUsuarios = context.functions.execute(
      "getCollectionInstance",
      "usuario"
    );

    const payload = await validate(request, collectionUsuarios);

    context.functions.execute("handlerResponse", response, payload);
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

const validate = async (request, collection) => {
  const body = { ...request.query };
  const moment = require("moment");

  if (!body.token) throw new Error("La URL es inválida");

  const token = body.token;
  const tokenDecoded = await context.functions.execute(
    "decodificarToken",
    body.token
  );

  if (!tokenDecoded) throw new Error("La URL es inválida");

  const { codigo, fechaGeneracion, fechaExpiracion } = tokenDecoded;

  if (!codigo || !fechaGeneracion || !fechaExpiracion)
    throw new Error("Token malformado");

  const usuarioRestablecimiento = await collection.findOne(
    {
      "tokenRestablecimiento.codigo": token,
      deleted: { $ne: true },
      activo: { $ne: false },
    },
    {
      email: 1,
      _id: -1
    }
  );

  
  if (!usuarioRestablecimiento) throw new Error("La URL es inválida o ha caducado");

  delete usuarioRestablecimiento._id

  if (Number(moment().format("x")) > Number(moment(fechaExpiracion).format("x")))
    throw new Error("La URL de restablecimiento ha caducado");

  return {
    token,
    usuarioRestablecimiento,
    fechaGeneracion,
    fechaExpiracion,
  };
};
