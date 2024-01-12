exports = async function(_id){
  const collectionConocimientos = context.services
      .get('mongodb-atlas')
      .db(context.environment.values.DB_NAME)
      .collection('conceptos');
  const conocimientos = await collectionConocimientos.findOne({_id: BSON.ObjectId(_id), deleted: { $ne: true }});
  return conocimientos;
};