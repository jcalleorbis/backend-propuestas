exports = async function(request, response){
  try {
    const { query, headers, body } = request
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)

    if (!body.text()) throw new Error ('No se esta enviando el body en el request');
    const parseBody = JSON.parse(body.text());
    const data = validate({...query, ...parseBody});
    
    const collectionPostulantes = context.services
      .get('mongodb-atlas')
      .db(context.environment.values.DB_NAME)
      .collection('postulantes');
    
    const queryUpdate = { _id: BSON.ObjectId(data.postulanteId) };
    const update = {
      $push: {
        comentarios: {comentario: data.comentario}
      }
    };
    const options = { "upsert": false };
    
    const { matchedCount, modifiedCount } = await collectionPostulantes.updateOne(queryUpdate, update, options);
    // Se valida el resultado
    if(!matchedCount && !modifiedCount) {
      throw new Error ('No se encontró postulante a editar a editar');
    }
    const postulante = await context.functions.execute('findPostulantePorId', data.postulanteId);
    context.functions.execute('handlerResponse', response, postulante);
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
};

const validate = ({ comentario, postulanteId }) => {
  if (!comentario) throw new Error("Debe añadir un comentario");
  if (!postulanteId) throw new Error("Debe añadir el postulanteId");
  return { comentario, postulanteId };
};