
exports = async function (request, response) {
  try {
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    await context.functions.execute("middlewareVerificarToken", request.headers, response)

    const { document, email } = validate(request)
    const collectionUsuarios = context.functions.execute("getCollectionInstance", "usuario")

    const { modifiedCount } = await collectionUsuarios.updateOne({ email: email, deleted: { $ne: true } }, {
      $set: document
    })

    context.functions.execute("handlerResponse", response, {
      modificado: Boolean(modifiedCount)
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

const validate = (request) => {
  const body = JSON.parse(request.body.text())
  
  if(!body.email) throw new Error("El Email es requerido")

  body.email = String(body.email).trim()

  return {
    email: body.email,
    document: {
      aceptaSincronizacion: false,
      // sincronizado: false,
      // sincronizadoCon: null,
    },
  }
}