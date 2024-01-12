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

    const { ofertaSku } = request.query

    if(!ofertaSku) throw new Error("El sku de la oferta es requerido")

    const collectionOfertas = context.functions.execute(
      "getCollectionInstance",
      "ofertas-empleo"
    );

    const query = {
      sku: ofertaSku, 
      deleted: { $ne: true }, 
    }

    const oferta = await collectionOfertas.findOne(query)

    if(!oferta) throw new Error("La Oferta Laboral buscada no existe")

    const ofertaPopulated = await context.functions.execute(
      "populateDocuments",
      {
        results: oferta,
        populateList: [{ ref: "empresa", collection: "empresas" }],
      }
    );

    context.functions.execute("handlerResponse", response, ofertaPopulated);

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
