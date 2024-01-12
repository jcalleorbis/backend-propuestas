exports = async function(request, response){
  try {
    const { query, headers, body } = request
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)

    const collectionCiudades = context.services
          .get('mongodb-atlas')
          .db(context.environment.values.DB_NAME)
          .collection('ciudades');
     const ciudades = await collectionCiudades.find({
          "pais._id": BSON.ObjectId(query.id)
      }).sort({
          nombre: 1
      }).toArray();
    context.functions.execute('handlerResponse', response, ciudades);
    
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
};