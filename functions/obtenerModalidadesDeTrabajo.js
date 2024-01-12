exports = async function(request, response){
  try {
    const { query, headers, body } = request
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)

    const collectionModalidadesTrabajo = context.services
         .get('mongodb-atlas')
         .db(context.environment.values.DB_NAME)
         .collection('modalidades-trabajo');
   const modalidades = await collectionModalidadesTrabajo.find({}).toArray();
   context.functions.execute('handlerResponse', response, modalidades);
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
};