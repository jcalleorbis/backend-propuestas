exports = async function (request, response) {
  try {
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    await context.functions.execute("middlewareVerificarToken", request.headers, response)
    
    const collectionEmpresas = context.functions.execute("getCollectionInstance", "empresas")

    const empresas = await collectionEmpresas.find({ deleted: { $ne: true } }).toArray()

    context.functions.execute('handlerResponse', response, empresas);
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
} 