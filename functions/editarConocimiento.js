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

    const collectionConocimiento = context.functions.execute(
      "getCollectionInstance",
      "conocimientos"
    );

    const payload = await validate(request, collectionConocimiento);

    const { matchedCount, modifiedCount } =
      await collectionConocimiento.updateOne(
        { _id: payload.documentId },
        {
          $set: payload.document
        }
      );

    if (!matchedCount && !modifiedCount)
      throw new Error("No se encontró el tipo de conocimiento a editar");

    const conocimientoDocument = await collectionConocimiento.findOne({
      _id: payload.documentId,
    });

    if(payload.permitSync) {
      await updateManyPostulantes({
        query: { 'skills.conocimiento._id': payload.documentId },
        value: { 'skills.$.conocimiento': conocimientoDocument }
      })
    }

    context.functions.execute(
      "handlerResponse",
      response,
      conocimientoDocument
    );

    context.functions.execute("handlerResponse", response, conocimientoDocument);
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

const validate = async (request, collection) => {
  const moment = require("moment");
  const body = JSON.parse(request.body.text());
  const jwtConfig = context.values.get("jwt_config");

  if (!body._id) throw new Error("El id del documento es requerido");
  if (!body.nombre) throw new Error("El nombre es requerido");
  if (!body.color) throw new Error("El color es requerido");
  if (!body.tipo || typeof body.tipo != "object")
    throw new Error("El Tipo de conocimiento es requerido");

  body.tipo = {
    ...body.tipo,
    _id: BSON.ObjectId(body.tipo?._id),
  };

  const existe = await context.functions.execute("validarPropiedadEnUso", {
    collection: collection,
    value: body.nombre,
    key: "nombre",
    extraParams: {
      _id: { $ne: BSON.ObjectId(body._id) },
      deleted: { $ne: true }
    },
  });

  if (existe) throw new Error("El nombre proporcionado ya existe");

  const sessionUser = request.headers?.[jwtConfig.headerUser];

  return {
    documentId: BSON.ObjectId(body._id),
    permitSync: body.permitirSincronizacion || false,
    document: {
      nombre: body.nombre || "",
      icon: body.icon || "",
      tipo: body.tipo,
      color: body.color || false,
      fechaActualizacion: moment().toDate(),
      actualizadoPor: sessionUser?._id,
    },
  };
};

const updateManyPostulantes = async ({ query, value }) => {
  const collectionPostulante = context.functions.execute(
    "getCollectionInstance",
    "postulantes"
  );
  await collectionPostulante.updateMany(query, {
    $set: value
  })
}