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
      "agrupaciones-concepto"
    );
    const payload = await validate(request, collectionTConocimientos);

    const { insertedId } = await collectionTConocimientos.insertOne(payload);

    if (!insertedId)
      throw new Error(
        "Ocurrió un error al intentar guardar el conocimiento en la BD."
      );

    const conocimientoDocument = await collectionTConocimientos.findOne({
      _id: insertedId,
    });

    context.functions.execute(
      "handlerResponse",
      response,
      conocimientoDocument
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

  if (!body.nombre) throw new Error("El nombre es requerido");

  const upperDocumentos = await collection.find({}).limit(1).sort({ orden: -1 }).toArray()
  const nextOrdenDocument = upperDocumentos[0]
  const nextOrden = (Number(nextOrdenDocument?.orden || 0)) + 1024
  const existe = await context.functions.execute("validarPropiedadEnUso", {
    collection: collection,
    value: body.nombre,
    key: "nombre",
    regexOptions: 'i',
    extraParams: {
      deleted: { $ne: true }
    }
  });

  if (existe) throw new Error("El nombre proporcionado ya existe");

  const sessionUser = request.headers?.[jwtConfig.headerUser];

  return {
    nombre: body.nombre?.trim() || "",
    orden: nextOrden,
    fechaRegistro: moment().toDate(),
    creadoPor: sessionUser?._id,
  };
};
