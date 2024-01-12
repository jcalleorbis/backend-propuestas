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

    const { conceptoId } = validate(request);

    const collectionConceptos = context.functions.execute(
      "getCollectionInstance",
      "conceptos"
    );

    const { matchedCount, modifiedCount } =
      await collectionConceptos.updateOne(
        { _id: conceptoId },
        {
          $set: {
            deleted: true,
          },
        }
      );

    if (!matchedCount && modifiedCount == 0)
      throw new Error("No se pudo eliminar el concepto seleccionado");

    await deleteManySkillsInPostulantes({ 
      query: { 'skills.conocimiento._id': conceptoId },
      value: { 'skills': {
          'conocimiento._id': conceptoId
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

  if (!params.conceptoId)
    throw new Error("El id del documento es requerido");

  return {
    conceptoId: BSON.ObjectId(params.conceptoId),
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