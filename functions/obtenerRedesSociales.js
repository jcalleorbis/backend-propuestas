exports = async function(request, response){
  try {
    const { query, headers, body } = request
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)

    const collectionRRSS = context.services
          .get('mongodb-atlas')
          .db(context.environment.values.DB_NAME)
          .collection('redes-sociales');
    const rrss = await collectionRRSS.find({}).toArray();
    context.functions.execute('handlerResponse', response, rrss);
    
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
};