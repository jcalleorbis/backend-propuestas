exports = async function (request, response) {
  try {
    await context.functions.execute(
      "middlewareVerificarOrigenClientId",
      request,
      response
    );

    const { filename, postulanteId, folder } = validate(request);

    const collectionPostulantes = context.functions.execute(
      "getCollectionInstance",
      "propuestas"
    );
    const collectionUsuarios = context.functions.execute(
      "getCollectionInstance",
      "usuario"
    );

    const removed = await context.functions.execute("gcpRemoveFileStorage", filename)

    await collectionPostulantes.updateOne({ _id: postulanteId }, {
      $set: {
        [folder]: ""
      }
    })
    await collectionUsuarios.updateOne({ "sincronizadoCon.identificador": postulanteId }, {
      $set: {
        [`candidato.${folder}`]: ""
      }
    })
    

    context.functions.execute('handlerResponse', response, {
      updated: true,
      fileRemoved: removed
    });
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

const validate = (request) => {
  const body = JSON.parse(request.body.text());
  if (!body.filename) throw new Error("El path es requerido");
  if (!body.postulanteId) throw new Error("El id del postulante es requerido");
  if (!body.folder) throw new Error("El folder es requerido");
  return {
    filename: body.filename,
    postulanteId: BSON.ObjectId(body.postulanteId),
    folder: body.folder
  };
};
