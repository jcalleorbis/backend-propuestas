

exports = async function (request, response) {
  try {
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    await context.functions.execute("middlewareVerificarToken", request.headers, response)

    const { email } = request.query

    if(!email) throw new Error("El email es requerido")

    const collectionUsuarios = context.functions.execute("getCollectionInstance", "usuario")

    const usuariosDoc = await collectionUsuarios.find({
      email: { $regex: String(email).toLowerCase(), $options: 'i' },
      deleted: { $ne: true }
    }).limit(10).toArray()

    if(!usuariosDoc) throw new Error("El usuario con ese email no existe")

    const usuarioPoblado = await context.functions.execute("populateDocuments", {
      results: usuariosDoc,
      populateList: [
        { ref: 'perfil', collection: 'perfiles' }
      ]
    })

    context.functions.execute("handlerResponse", response, usuarioPoblado);
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