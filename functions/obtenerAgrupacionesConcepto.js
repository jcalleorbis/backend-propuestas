exports = async function(request, response){
  try {
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)

    const collectionTiposConocimiento = context.functions.execute("getCollectionInstance", "agrupaciones-concepto")

    const agrupacionesConceptos = await collectionTiposConocimiento.find({ deleted: { $ne: true } }).sort({ orden: 1 }).toArray();
    
    context.functions.execute('handlerResponse', response, agrupacionesConceptos);
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
};