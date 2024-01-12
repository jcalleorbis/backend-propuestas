

exports = async function (request, response) {
  try {

    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    await context.functions.execute("middlewareVerificarToken", request.headers, response)
    
    const collectionUsuarios = context.functions.execute("getCollectionInstance", "usuario")

    const payload = await validate(request, collectionUsuarios);

    const { matchedCount, modifiedCount } = await collectionUsuarios.updateOne({ _id: BSON.ObjectId(payload.documentId) }, {
      $set: payload.document
    })

    if (!matchedCount && !modifiedCount) throw new Error("No se encontró el usuario a editar");

    const usuarioDocument = await collectionUsuarios.findOne({ _id: BSON.ObjectId(payload.documentId) })

    context.functions.execute('handlerResponse', response, usuarioDocument);
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
}

const validate = async (request, collectionUsuarios) => {
  const body = JSON.parse(request.body.text())
  const moment = require("moment")
  const jwtConfig = context.values.get("jwt_config")

  if(!body._id) throw new Error("El id del documento es requerido")
  if(!body.email) throw new Error("El correo es requerido")
  if(!body.perfil) throw new Error("El perfil es requerido")
  
  const sessionUser = request.headers?.[jwtConfig.headerUser]

  if(body.empresa) {
    body.empresa = BSON.ObjectId(body.empresa)
  }

  return {
    documentId: body._id,
    document: {
      email: body.email,
      perfil: BSON.ObjectId(body.perfil),
      empresa: body.empresa || sessionUser.empresa || null,
      activo: body.activo || false,
      fechaActualizacion: moment().toDate(),
      actualizadoPor: sessionUser?._id
    }
  }
}