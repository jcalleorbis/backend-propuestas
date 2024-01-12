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

    const { entrevistaId, updateOptions } = await validateData(request);

    const collectionEntrevistas = context.functions.execute(
      "getCollectionInstance",
      "entrevistas"
    );

    const { matchedCount, modifiedCount } =
      await collectionEntrevistas.updateOne(
        {
          _id: entrevistaId,
        },
        updateOptions
      );

    if (!matchedCount && !modifiedCount)
      throw new Error("No se pudo iniciar la entrevista, inténtelo más tarde.");

    context.functions.execute("handlerResponse", response, {
      iniciado: Boolean(modifiedCount),
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

const validateData = async (request) => {
  const body = JSON.parse(request.body.text());
  const moment = require("moment");
  const jwtConfig = context.values.get("jwt_config");

  if (!body.entrevistaId)
    throw new Error("El ID de la entrevista es requerido");

  const document = await context.functions.execute("obtenerDocumentoPorQuery", {
    query: {
      _id: BSON.ObjectId(body.entrevistaId),
      deleted: { $ne: true },
    },
    collectionName: "entrevistas",
  });

  if (!document) throw new Error("El ID de la entrevista no existe!");

  if (document.culminado) throw new Error("La entrevista ha culminado");

  const entrevista = await context.functions.execute("populateDocuments", {
    results: document,
    populateList: [
      {
        ref: "reclutador",
        collection: "usuario",
      },
    ],
  });

  if(document.reclutador && document.codigoAutorizacion) {
    const { fechaExpiracion = '' } = await context.functions.execute(
      "decodificarToken",
      document.codigoAutorizacion
    );
    if (fechaExpiracion &&
      Number(moment(fechaExpiracion).format("x")) >
        Number(moment().format("x"))
    )
      throw new Error(
        `Esta entrevista se encuentra en curso con el usuario\n${entrevista?.reclutadorDoc?.email}`
      );
  }



  const sessionUser = request.headers?.[jwtConfig.headerUser];

  const codigoExpiracion = context.functions.execute(
    "generarCodigoVencimiento",
    {
      maxTiempoExpiracion: 3,
      tipoExpiracion: "hours",
      requireFirma: true,
    }
  );

  const updateOptions = {
    $set: {
      fechaInicioEntrevista: codigoExpiracion.fechaGeneracion,
      fechaFinEntrevista: codigoExpiracion.fechaExpiracion,
      codigoAutorizacion: codigoExpiracion.codigo,
      reclutador: sessionUser?._id,
    },
  };

  return {
    entrevistaId: BSON.ObjectId(body.entrevistaId),
    updateOptions,
  };
};
