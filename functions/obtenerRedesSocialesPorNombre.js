exports = async function(nombre){
  const collectionRRSS = context.services
      .get('mongodb-atlas')
      .db(context.environment.values.DB_NAME)
      .collection('redes-sociales');
  const rrss = await collectionRRSS.findOne({nombre: nombre});
  return rrss;
};