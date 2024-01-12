exports = async function(_id, creadorId){
  const collectionPostulantes = context.services
      .get('mongodb-atlas')
      .db(context.environment.values.DB_NAME)
      .collection('postulantes');
  
  const query = {
    _id: BSON.ObjectId(_id),
  }

  if(creadorId) {
    query.creadorId = BSON.ObjectId(creadorId)
  }
  
  const postulantes = await collectionPostulantes.findOne(query);
  return postulantes;
};