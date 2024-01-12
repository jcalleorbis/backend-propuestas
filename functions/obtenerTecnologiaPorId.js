exports = async function(_id){
  const collectionTecnologias = context.services
      .get('mongodb-atlas')
      .db(context.environment.values.DB_NAME)
      .collection('tecnologias');
  const tecnologias = await collectionTecnologias.findOne({_id: BSON.ObjectId(_id)});
  return tecnologias;
};