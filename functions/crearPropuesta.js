exports = async function (request, response) {
  try {
    const { query, headers, body } = request;

    await context.functions.execute(
      "middlewareVerificarOrigenClientId",
      request,
      response
    );
    await context.functions.execute(
      "middlewareVerificarToken",
      headers,
      response
    );

    if (!body.text())
      throw new Error("No se esta enviando el body en el request");

    const parseBody = await context.functions.execute(
      "validarPropuesta",
      JSON.parse(body.text())
    );
    
    const collectionPropuestas = context.functions.execute(
      "getCollectionInstance",
      "propuestas"
    );

    // Se añade código incrementable al postulante
    const dtoPropuesta = {
      ...parseBody,
      codigo: await context.functions.execute(
        "obtenerSiguienteCodigoPropuesta"
      ),
    };

    const { insertedId } = await collectionPropuestas.insertOne(dtoPropuesta);

    // Se valida el resultado
    if (!insertedId) {
      throw new Error("No se encontró propuesta a agregar");
    }

    const propuesta = await context.functions.execute(
      "findPostulantePorId",
      `${insertedId}`
    );


    context.functions.execute("handlerResponse", response, propuesta);
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
