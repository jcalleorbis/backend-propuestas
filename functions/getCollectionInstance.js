
exports = (collectionName) => {
  return context.services
  .get('mongodb-atlas')
  .db(context.environment.values.DB_NAME)
  .collection(collectionName);
}