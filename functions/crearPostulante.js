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
      "validarPostulante",
      JSON.parse(body.text())
    );
    
    const collectionPostulantes = context.functions.execute(
      "getCollectionInstance",
      "postulantes"
    );

    // Se añade código incrementable al postulante
    const dtoPostulante = {
      ...parseBody,
      codigo: await context.functions.execute(
        "obtenerSiguienteCodigoPostulante"
      ),
    };

    const { insertedId } = await collectionPostulantes.insertOne(dtoPostulante);

    // Se valida el resultado
    if (!insertedId) {
      throw new Error("No se encontró postulante a agregar");
    }

    const postulante = await context.functions.execute(
      "findPostulantePorId",
      `${insertedId}`
    );


    context.functions.execute("handlerResponse", response, postulante);
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
