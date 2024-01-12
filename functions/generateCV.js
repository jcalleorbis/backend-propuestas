// This function is the endpoint's request handler.
exports = async function({ query, headers, body}, response) {
    const {idPostulante} = query;

    // Querying a mongodb service:
    const collectionpostulantes = context.services
            .get("mongodb-atlas")
            .db(context.environment.values.DB_NAME)
            .collection('postulantes');
    const postulante = await collectionpostulantes.find({"_id":BSON.ObjectId(idPostulante)}).toArray();
    //const postulante = await collectionpostulantes.findOne({"_id":BSON.ObjectId(idPostulante)});
    context.functions.execute('handlerResponse', response, {postulante,idPostulante});
};
