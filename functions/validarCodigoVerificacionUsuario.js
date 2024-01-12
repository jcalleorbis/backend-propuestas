exports = async function (request, response)  {
  try {
    //await context.functions.execute("middlewareVerificarOrigenClientId", request, response)

    const collectionUsuarios = context.functions.execute(
      "getCollectionInstance",
      "usuario"
    );

    const { document, email, usuarioId } = await validate(request, collectionUsuarios)

    const { matchedCount, modifiedCount } = await collectionUsuarios.updateOne({ _id: usuarioId }, {
      $set: document
    })

    if (!matchedCount && !modifiedCount)
      throw new Error(
        "No se pudo verificar su cuenta.\nPor favor, inténtelo más tarde"
      );

    context.functions.execute("handlerResponse", response, {
      verificado: true,
      email: email
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
  const body = JSON.parse(request.body.text())
  const recappConfig = context.values.get("recapp_config");
  const moment = require("moment")

  if(!body.email) throw new Error("El email es requerido");
  
  if(!body.codigo) throw new Error("El código de verificación es requerido");
  
  if(body.codigo.length !== recappConfig.code_verification_length) throw new Error("El código de verificación es incorrecto");

  const usuario = await collection.findOne({ email: { $regex: body.email, $options: 'i' }, "tokenVerificacion.codigo": body.codigo })

  if(!usuario) throw new Error("El código de verificación es incorrecto");

  if(usuario?.deleted == true) throw new Error("Su cuenta no existe en nuestro sistema");

  if(usuario?.activo == false) throw new Error("Su cuenta ha sido deshabilitada temporalmente y no puede continuar con la verificación.");

  // validar fechas
  if(Number(moment().format('x')) > Number(moment(usuario.tokenVerificacion.fechaExpiracion).format('x')))
    throw new Error("El código de verificación ha expirado.");

  const usuarioId = usuario._id

  return {
    usuarioId: usuarioId,
    email: body.email,
    codigo: body.codigo,
    document: {
      tokenVerificacion: null,
      verificado: true,
      fechaVerificacion: moment().toDate(),
    }
  }
}