exports = async function (request, response){
  try {
    const { query, headers, body } = request
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)

    const collectionEstadosPostulante = context.services
          .get('mongodb-atlas')
          .db(context.environment.values.DB_NAME)
          .collection('estados-propuesta');
    const estadosPostulante = await collectionEstadosPostulante.find({}).sort({ estado: 1 }).toArray();
    context.functions.execute('handlerResponse', response, estadosPostulante);
    
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
};