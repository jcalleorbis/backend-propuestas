exports = async function(email){
  const collectionPostulantes = context.functions.execute("getCollectionInstance", "propuestas")
  const postulante = await collectionPostulantes.findOne({ email: { "$regex": email, "$options": "i" }});
  return postulante;
};