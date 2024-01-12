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

    const collectionTConocimientos = context.functions.execute(
      "getCollectionInstance",
      "tipos-conocimiento"
    );

    const payload = await validate(request, collectionTConocimientos);

    const { matchedCount, modifiedCount } =
      await collectionTConocimientos.updateOne(
        { _id: payload.documentId },
        {
          $set: payload.document,
        }
      );

    if (!matchedCount && !modifiedCount)
      throw new Error("No se encontró el tipo de conocimiento a editar");

    const tConocimientoDocument = await collectionTConocimientos.findOne({
      _id: payload.documentId,
    });

    if (payload.permitSync) {
      await updateManyConocimientos(payload.documentId, tConocimientoDocument);
    }

    context.functions.execute(
      "handlerResponse",
      response,
      tConocimientoDocument
    );
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
  const body = JSON.parse(request.body.text());
  const moment = require("moment");
  const jwtConfig = context.values.get("jwt_config");

  if (!body._id) throw new Error("El id del documento es requerido");
  if (!body.nombre) throw new Error("El nombre es requerido");

  const existe = await context.functions.execute("validarPropiedadEnUso", {
    collection: collection,
    value: body.nombre,
    key: "nombre",
    regexOptions: "i",
    extraParams: {
      deleted: { $ne: true },
      _id: { $ne: BSON.ObjectId(body._id) },
    },
  });

  if (existe) throw new Error("El nombre proporcionado ya existe");

  const sessionUser = request.headers?.[jwtConfig.headerUser];

  body.orden = Number(body.orden || 0);

  return {
    documentId: BSON.ObjectId(body._id),
    permitSync: body.permitirSincronizacion || false,
    document: {
      nombre: body.nombre?.trim() || "",
      orden: body.orden,
      fechaActualizacion: moment().toDate(),
      actualizadoPor: sessionUser?._id,
    },
  };
};

const updateManyConocimientos = async (tipoId, tipoUpdated) => {
  const collectionConocimientos = context.functions.execute(
    "getCollectionInstance",
    "conocimientos"
  );
  const collectionPostulantes = context.functions.execute(
    "getCollectionInstance",
    "postulantes"
  );

  await collectionConocimientos.updateMany(
    { "tipo._id": tipoId },
    {
      $set: {
        tipo: tipoUpdated,
      },
    }
  );
  await collectionPostulantes.updateMany(
    { "skills.conocimiento.tipo._id": tipoId },
    {
      $set: {
        "skills.$[skill].conocimiento.tipo": tipoUpdated,
      },
    },
    {
      arrayFilters: [
        {
          "skill.conocimiento.tipo._id": tipoId,
        },
      ],
    }
  );
};
