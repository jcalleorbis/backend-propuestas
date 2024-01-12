exports = async function(nombre){
  const collectionContadores = context.services
      .get('mongodb-atlas')
      .db(context.environment.values.DB_NAME)
      .collection('contadores');
  const contadores = await collectionContadores.findOne({coleccion: nombre});
  return contadores;
};