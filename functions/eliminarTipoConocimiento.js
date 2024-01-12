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

    const { tipoConocimientoId, document } = await validate(request);

    const collectionTiposConocimiento = context.functions.execute(
      "getCollectionInstance",
      "tipos-conocimiento"
    );

    const { matchedCount, modifiedCount } =
      await collectionTiposConocimiento.updateOne(
        { _id: tipoConocimientoId },
        { $set: document }
      );

    if (!matchedCount && modifiedCount == 0)
      throw new Error(
        "No se pudo eliminar el tipo de conocimiento seleccionado"
      );

    context.functions.execute("handlerResponse", response, {
      deleted: true,
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

const validate = async (request) => {
  const params = { ...request.query };
  const moment = require("moment");
  const jwtConfig = context.values.get("jwt_config");
  
  if (!params.tipoConocimientoId)
    throw new Error("El id del documento es requerido");

  const collectionConocimientos = context.functions.execute(
    "getCollectionInstance",
    "conocimientos"
  );

  const tiposEnUso = await collectionConocimientos
    .find({
      "tipo._id": BSON.ObjectId(params.tipoConocimientoId),
      deleted: { $ne: true }
    })
    .toArray();

  if (tiposEnUso?.length > 0) {
    throw new Error({
      errorMessage:
        'El Tipo de conocimiento se encuentra actualmente en uso.<br/>Si desea eliminar este elemento dirijase a la pestaña de "Conocimientos" y remueva esta categoria de los siguientes conocimientos:',
      errorData: tiposEnUso,
    });
  }

  const sessionUser = request.headers?.[jwtConfig.headerUser];

  return {
    tipoConocimientoId: BSON.ObjectId(params.tipoConocimientoId),
    document: {
      fechaEliminacion: moment().toDate(),
      eliminadoPor: sessionUser?._id,
      deleted: true,
    },
  };
};
