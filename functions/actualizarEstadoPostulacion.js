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

    const { document, postulacionId } = await validate(request);

    const collectionPostulaciones = context.functions.execute("getCollectionInstance", "postulaciones")

    const { matchedCount, modifiedCount } = await collectionPostulaciones.updateOne({ _id: postulacionId }, {
      $set: document
    })

    if (!matchedCount && !modifiedCount) throw new Error("No se pudo actualizar, vuelva a intentarlo.");

    const postulacion = await collectionPostulaciones.findOne({ _id: postulacionId })

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

const validate = async (request) => {
  const body = JSON.parse(request.body.text());
  const moment = require("moment");

  if (!body.postulacionId)
    throw new Error("El id de la postulación es requerido");

  if (!body.estatus)
    throw new Error("El nuevo estado es requerido");

  const estado = {
    ...body.estatus,
    _id: BSON.ObjectId(body.estatus?._id)
  }

  return {
    postulacionId: BSON.ObjectId(body.postulacionId),
    document: {
      estatus: estado,
      fechaActualizacion: moment().toDate()
    },
  };
};
