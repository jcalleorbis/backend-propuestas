
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

    const { usuario, password, payloadRestablecimiento } = await validate(request, collectionUsuarios)

    let updateParams = {
      $set: {},
      $push: {}
    }

    updateParams.$set.password = password
    updateParams.$set.tokenRestablecimiento = null

    if(!usuario.historialTokensRecuperacion) {
      updateParams.$set.historialTokensRecuperacion = [payloadRestablecimiento]
      delete updateParams.$push
    } else {
      updateParams.$push.historialTokensRecuperacion = payloadRestablecimiento
    }

    const { matchedCount, modifiedCount } = await collectionUsuarios.updateOne({ _id: usuario._id }, updateParams)
    
    if (!matchedCount && !modifiedCount) throw new Error("No se pudo modificar la contraseña.");

    context.functions.execute("handlerResponse", response, {
      message: '¡Su nueva contraseña se guardó correctamente!',
      email: usuario.email,
    });

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

const validate = async (request, collection) => {
  const body = JSON.parse(request.body.text());
  const moment = require("moment");
  const passwordHash = require('password-hash');

  if(!body.token) throw new Error("El token es requerido")
  if(!body.password) throw new Error("La contraseña es requerida")
  if(!body.passwordConfirmacion) throw new Error("La contraseña de confirmación es requerida")
  if(body.passwordConfirmacion != body.password) throw new Error("Las contraseñas no coinciden")

  const token = body.token;
  const tokenDecoded = await context.functions.execute(
    "decodificarToken",
    body.token
  );

  if (!tokenDecoded) throw new Error("La URL de restablecimiento es inválida");

  const { codigo, fechaGeneracion, fechaExpiracion } = tokenDecoded;

  if (!codigo || !fechaGeneracion || !fechaExpiracion)
    throw new Error("La URL de restablecimiento es inválida");

  const usuarioRestablecimiento = await collection.findOne(
    {
      "tokenRestablecimiento.codigo": token,
      deleted: { $ne: true },
      activo: { $ne: false },
    },
    {
      email: 1,
      _id: 1,
      password: 1,
      tokenRestablecimiento: 1,
      historialTokensRecuperacion: 1
    }
  );

  if (!usuarioRestablecimiento) throw new Error("La URL de restablecimiento ha caducado");

  if (Number(moment().format("x")) > Number(moment(fechaExpiracion).format("x")))
    throw new Error("La URL de restablecimiento ha caducado");

  const hashedPassword = await passwordHash.generate(body.password)

  const payloadRestablecimiento = {
    ...usuarioRestablecimiento.tokenRestablecimiento,
    passwordActual: usuarioRestablecimiento.password,
    passwordNuevo: hashedPassword,
    fechaActualizacion: moment().toDate()
  }

  return {
    usuario: usuarioRestablecimiento,
    password: hashedPassword,
    payloadRestablecimiento
  }
}