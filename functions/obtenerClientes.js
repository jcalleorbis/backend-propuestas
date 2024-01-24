exports = async function(request, response){
    try {
      await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
      
      const collectionConcepto = context.functions.execute("getCollectionInstance", "clientes")
      const conceptos = await collectionConcepto.find({ deleted: { $ne: true } }).toArray();
      
      context.functions.execute('handlerResponse', response, conceptos);
    } catch (err) {
      context.functions.execute('handlerResponse', response, null, 400, false, err.message);
    }
  };