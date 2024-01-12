exports = async function(request, response){
  try {
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    
    const collectionConocimiento = context.functions.execute("getCollectionInstance", "conocimientos")
    const conocimientos = await collectionConocimiento.find({ deleted: { $ne: true } }).toArray();
    
    context.functions.execute('handlerResponse', response, conocimientos);
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
};