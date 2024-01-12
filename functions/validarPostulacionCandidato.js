exports = async function (request, response) {
  try {
    await context.functions.execute(
      "middlewareVerificarOrigenClientId",
      request,
      response
    );
    await context.functions.execute(
      "middlewareVerificarToken",
      request.headers,
      response
    );

    const jwtConfig = context.values.get("jwt_config");
    const sessionUser = request.headers?.[jwtConfig.headerUser];

    const { ofertaId } = request.query
    const postulanteId = sessionUser?.sincronizadoCon?.identificador

    if(!ofertaId) throw new Error("El ID de la oferta es requerido")
    if(!postulanteId) throw new Error("No se encontró el ID del postulante")

    const collectionPostulaciones = context.functions.execute(
      "getCollectionInstance",
      "postulaciones"
    );

    const query = {
      postulante: postulanteId,
      oferta: BSON.ObjectId(ofertaId),
      deleted: { $ne: true }, 
    }

    const postulacion = await collectionPostulaciones.findOne(query)
    
    context.functions.execute("handlerResponse", response, postulacion);

  } catch (err) {
    context.functions.execute(
      "handlerResponse",
      response,
      null,
      400,
      false,
      err.message
    );
  }
};
