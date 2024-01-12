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

    const { entrevistaPendiente, collectionName, querySearchPostulante } =
      await validate(request);

    const collectionPostulantes = context.functions.execute(
      "getCollectionInstance",
      collectionName
    );

    entrevistaPendiente.collection = collectionName
    entrevistaPendiente.querySearchPostulante = querySearchPostulante

    const postulante = await collectionPostulantes.findOne(
      { ...querySearchPostulante, deleted: { $ne: true } },
      {
        invitacionEdicion: 0,
        historialCambios: 0,
      }
    );

    entrevistaPendiente.postulanteDoc = postulante

    const entrevistaPoblada = await context.functions.execute(
      "populateDocuments",
      {
        results: entrevistaPendiente,
        populateList: [
          /* {
            ref: "postulante",
            collection: "postulantes",
            fieldsOptions: {
              invitacionEdicion: 0,
              historialCambios: 0,
              // invitacionesHistorial: 0,
            },
          }, */
          {
            ref: "asignadoPor",
            collection: "usuario",
            fieldsOptions: {
              password: 0,
              candidato: 0,
              sincronizadoCon: 0,
              perfil: 0,
              servicioAuth: 0,
              tokenVerificacion: 0,
              actualizadoPor: 0,
              creadoPor: 0,
            },
          },
        ],
      }
    );

    context.functions.execute("handlerResponse", response, entrevistaPoblada);
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
  const { query } = request;
  const moment = require("moment");
  const jwtConfig = context.values.get("jwt_config");

  if (!query.entrevistaId)
    throw new Error("El ID de la entrevista es requerido");

  const querySearch = {
    _id: BSON.ObjectId(query.entrevistaId),
    deleted: { $ne: true },
  };

  const collectionEntrevistas = context.functions.execute(
    "getCollectionInstance",
    "entrevistas"
  );

  const entrevistaPendiente = await collectionEntrevistas.findOne(querySearch);

  if (!entrevistaPendiente)
    throw new Error("El ID de la entrevista proporcionada no existe!");

  if (entrevistaPendiente.culminado)
    throw new Error("Esta entrevista ha culminado!");

  const sessionUser = request.headers?.[jwtConfig.headerUser];

  if (
    entrevistaPendiente.reclutador &&
    entrevistaPendiente.reclutador?.toString() !== sessionUser?._id?.toString()
  )
    throw new Error("La entrevista se encuentra en curso con otro reclutador.");

  /* if (
    entrevistaPendiente.fechaFinEntrevista &&
    Number(moment(entrevistaPendiente.fechaFinEntrevista).format("x")) <
      Number(moment().format("x"))
  ) {
    throw new Error(
      "La entrevista se encuentra en curso con otro reclutador y el tiempo aún no expira."
    );
  } */

  const collectionName = entrevistaPendiente.empresa
    ? "postulante-empresa"
    : "postulantes";

  let querySearchPostulante = {
    _id: entrevistaPendiente.postulante,
  };

  if (entrevistaPendiente.empresa) {
    querySearchPostulante = {
      empresa: entrevistaPendiente.empresa,
      postulante: entrevistaPendiente.postulante,
    };
  }

  return {
    entrevistaPendiente,
    querySearchPostulante,
    collectionName,
  };
};
