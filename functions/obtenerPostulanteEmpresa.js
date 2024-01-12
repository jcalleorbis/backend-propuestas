exports = async function(request, response){
  try {
    const { query, headers, body } = request

    // middlewares validación token y client id
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    await context.functions.execute("middlewareVerificarToken", headers, response)

    const querySearch = validate(request)

    const collectionPostulantes = context.functions.execute(
      "getCollectionInstance",
      "postulante-empresa"
    );

    const postulante = await collectionPostulantes.findOne(querySearch)

    context.functions.execute('handlerResponse', response, postulante);
  } catch (err) {
    if(err.message === "eliminado") {
      context.functions.execute('handlerResponse', response, null, 404, false, null);
    } else {
      context.functions.execute('handlerResponse', response, null, 400, false, err.message);
    }
  }
};

const validate = (request) => {
  const { query } = request

  if(!query.postulanteId) throw new Error("El id del postulante es requerido")
  if(!query.empresaId) throw new Error("El id de la empresa es requerido")

  const querySearch = {
    empresa: BSON.ObjectId(query.empresaId),
    postulante: BSON.ObjectId(query.postulanteId),
    deleted: { $ne: true }
  }

  return querySearch
};