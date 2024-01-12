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

    const { conocimientoId } = validate(request);

    const collectionConocimientos = context.functions.execute(
      "getCollectionInstance",
      "conceptos"
    );

    const { matchedCount, modifiedCount } =
      await collectionConocimientos.updateOne(
        { _id: conocimientoId },
        {
          $set: {
            deleted: true,
          },
        }
      );

    if (!matchedCount && modifiedCount == 0)
      throw new Error("No se pudo eliminar el conocimiento seleccionado");

    await deleteManySkillsInPostulantes({ 
      query: { 'skills.conocimiento._id': conocimientoId },
      value: { 'skills': {
          'conocimiento._id': conocimientoId
        }
      }
    })
    context.functions.execute("handlerResponse", response, { deleted: true });
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
  const params = { ...request.query };

  if (!params.conocimientoId)
    throw new Error("El id del documento es requerido");

  return {
    conocimientoId: BSON.ObjectId(params.conocimientoId),
  };
};


const deleteManySkillsInPostulantes = async ({ query, value }) => {
  const collectionPostulante = context.functions.execute(
    "getCollectionInstance",
    "propuestas"
  );
  await collectionPostulante.updateMany(query, {
    $pull: value
  })
}