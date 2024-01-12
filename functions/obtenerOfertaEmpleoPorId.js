exports = async function (request, response) {
  try {
    await context.functions.execute(
      "middlewareVerificarOrigenClientId",
      request,
      response
    );
    /* await context.functions.execute(
      "middlewareVerificarToken",
      request.headers,
      response
    ); */

    const { ofertaId, empresa } = request.query

    if(!ofertaId) throw new Error("El id de la oferta es requerido")

    const collectionOfertas = context.functions.execute(
      "getCollectionInstance",
      "ofertas-empleo"
    );

    const query = {
      _id: BSON.ObjectId(ofertaId), 
      deleted: { $ne: true }, 
    }

    if(empresa) {
      query.empresa = BSON.ObjectId(empresa)
    }

    const oferta = await collectionOfertas.findOne(query)

    if(!oferta) throw new Error("La Oferta Laboral buscada no existe")

    context.functions.execute("handlerResponse", response, oferta);

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
