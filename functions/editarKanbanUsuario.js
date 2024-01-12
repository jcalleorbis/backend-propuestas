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

    const { document, kanbanId } = await validate(request);

    const collectionKanban = context.functions.execute("getCollectionInstance", "kanban-usuarios")

    const { matchedCount, modifiedCount } = await collectionKanban.updateOne({ _id: kanbanId }, {
      $set: document
    })

    if (!matchedCount && !modifiedCount) throw new Error("No se pudo actualizar la configuración, vuelva a intentarlo.");

    const kanbanUsuario = await collectionKanban.findOne({ _id: kanbanId })

    context.functions.execute("handlerResponse", response, kanbanUsuario);
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

  if (!body.kanbanId)
    throw new Error("El id de su configuración kanban es requerido");

  const estados = body.estados
    ? body.estados?.map((estado) => {
        return {
          ...estado,
          _id: BSON.ObjectId(estado._id),
        };
      })
    : [];

  return {
    kanbanId: BSON.ObjectId(body.kanbanId),
    document: {
      estados: estados,
      fechaActualizacion: moment().toDate()
    },
  };
};
