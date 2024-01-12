exports = async function(request, response){
  try {
    const { query, headers, body } = request
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)

    const collectionPaises = context.services
          .get('mongodb-atlas')
          .db(context.environment.values.DB_NAME)
          .collection('tecnologias');
    const tecnologias = await collectionPaises.find({}).toArray();
    context.functions.execute('handlerResponse', response, tecnologias);
    
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
};