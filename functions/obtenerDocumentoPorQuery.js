exports = async function({ query = {}, output = {}, collectionName = 'postulantes' }){
  const collection = context.functions.execute("getCollectionInstance", collectionName)
  const result = await collection.findOne(query, output);
  return result;
};