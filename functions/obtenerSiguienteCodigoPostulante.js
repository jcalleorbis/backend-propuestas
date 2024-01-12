exports = async function () {
  const collectionSecuencias = context.services
    .get('mongodb-atlas')
    .db(context.environment.values.DB_NAME)
    .collection('secuencias');

  const query = { coleccion: "postulantes" }
  const update = { $inc: { valorSecuencia: 1 }}

  await collectionSecuencias.updateOne(query, update)
  const docSecuencia = await collectionSecuencias.findOne(query)
  
  return docSecuencia.valorSecuencia
}