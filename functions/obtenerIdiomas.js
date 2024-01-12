exports = async function(request, response){
  try {
    const { query, headers, body } = request
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)

    const collectionIdiomas = context.services
          .get('mongodb-atlas')
          .db(context.environment.values.DB_NAME)
          .collection('idiomas');
    const paises = await collectionIdiomas.find({}).toArray();
    context.functions.execute('handlerResponse', response, paises);
    
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
};