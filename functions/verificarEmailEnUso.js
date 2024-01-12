
exports = async (request, response) => {
  try {
    //await context.functions.execute("middlewareVerificarOrigenClientId", request, response)

    const body = {...request.query}
    const collectionUsuarios = context.functions.execute("getCollectionInstance", "usuario")

    if(!body.email) throw new Error("El email es requerido")

    const mailInUse = await context.functions.execute("validarPropiedadEnUso", { 
      collection: collectionUsuarios, 
      value: body.email,
      key: 'email',
    })

    context.functions.execute('handlerResponse', response, {
      disponible: !mailInUse,
      email: body.email,
    });
    
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
}