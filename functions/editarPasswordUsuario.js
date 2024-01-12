
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

    if(!usuarioDocument) throw new Error("El usuario se modificó, pero ocurrió un error obteniendo los datos del usuario actualizados.");

    const usuarioDocumentPopulate = await context.functions.execute("populateDocuments", {
      results: usuarioDocument,
      populateList: [
        { ref: 'perfil', collection: 'perfiles' },
        { ref: 'creadoPor', collection: 'usuario' },
        { ref: 'actualizadoPor', collection: 'usuario' }
      ]
    })

    context.functions.execute('handlerResponse', response, usuarioDocumentPopulate);
  } catch (err) {
     context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
}

const validate = async (request) => {
  const body = JSON.parse(request.body.text())
  const moment = require("moment")
  const jwtConfig = context.values.get("jwt_config")
  const passwordHash = require('password-hash');

  if(!body._id) throw new Error("El id del documento es requerido")
  if(!body.password) throw new Error("La contraseña es requerida")
  if(!body.passwordConfirmacion) throw new Error("La contraseña de confirmación es requerida")

  if(body.password !== body.passwordConfirmacion) throw new Error("Las contraseñas no coinciden")
  
  const hashedPassword = await passwordHash.generate(body.password)
  const sessionUser = request.headers?.[jwtConfig.headerUser]

  return {
    documentId: body._id,
    document: {
      password: hashedPassword,
      fechaActualizacion: moment().toDate(),
      actualizadoPor: sessionUser?._id
    }
  }
}