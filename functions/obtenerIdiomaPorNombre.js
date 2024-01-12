exports = async function(idioma){
  const data = context.services
      .get('mongodb-atlas')
      .db(context.environment.values.DB_NAME)
      .collection('idiomas');
  const resultado = await data.findOne({idioma: {'$regex' : `^${idioma}$`, '$options' : 'i'}});
  return resultado;
};