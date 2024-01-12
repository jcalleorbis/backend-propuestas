exports = async function (request, response) {
  try {
    await context.functions.execute(
      "middlewareVerificarOrigenClientId",
      request,
      response
    );

    const { entrevista, collectionName, querySearchPostulante } = await validate(request);
    
    const collectionPostulantes = context.functions.execute(
      "getCollectionInstance",
      collectionName
    );

    entrevista.collection = collectionName
    entrevista.querySearchPostulante = querySearchPostulante

    const postulante = await collectionPostulantes.findOne(
      { ...querySearchPostulante, deleted: { $ne: true } },
      {
        invitacionEdicion: 0,
        historialCambios: 0,
      }
    );

    entrevista.postulanteDoc = postulante

    const entrevistaPoblada = await context.functions.execute(
      "populateDocuments",
      {
        results: entrevista,
        populateList: [
          /* {
            ref: "postulante",
            collection: "propuestas",
            fieldsOptions: {
              invitacionEdicion: 0,
              historialCambios: 0,
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
  const moment = require("moment");
  const { token = "" } = request?.query;

  if (!token) throw new Error("El Código de autorizacion es requerido");

  const tokenDecoded = await context.functions.execute(
    "decodificarToken",
    token
  );

  const { fechaExpiracion } = tokenDecoded;

  if (!fechaExpiracion)
    throw new Error("El Código de autorizacion es incorrecto");

  if (
    Number(moment().format("x")) > Number(moment(fechaExpiracion).format("x"))
  )
    throw new Error(
      "El Código de autorizacion para visualizar la entrevista ha caducado."
    );

  const collectionEntrevistas = context.functions.execute(
    "getCollectionInstance",
    "entrevistas"
  );

  const querySearch = {
    codigoAutorizacion: token,
    deleted: { $ne: true },
    culminado: { $ne: true },
  };

  const entrevista = await collectionEntrevistas.findOne(querySearch);

  if (!entrevista) throw new Error("El Código de autorizacion es incorrecto.");

  const collectionName = entrevista.empresa
    ? "postulante-empresa"
    : "propuestas";
    
  let querySearchPostulante = {
    _id: entrevista.postulante,
  };

  if (entrevista.empresa) {
    querySearchPostulante = {
      empresa: entrevista.empresa,
      postulante: entrevista.postulante,
    };
  }

  return {
    entrevista,
    querySearchPostulante,
    collectionName
  };
};
