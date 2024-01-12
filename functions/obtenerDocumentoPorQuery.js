exports = async function({ query = {}, output = {}, collectionName = 'propuestas' }){
  const collection = context.functions.execute("getCollectionInstance", collectionName)
  const result = await collection.findOne(query, output);
  return result;
};