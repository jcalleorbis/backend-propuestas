exports = async function(tecnologia){
  const data = context.services
      .get('mongodb-atlas')
      .db(context.environment.values.DB_NAME)
      .collection('tecnologias');
  const resultado = await data.findOne({nombre: {'$regex' : `^${tecnologia}$`, '$options' : 'i'}});
  return resultado;
};