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

    const moment = require("moment");
    const { querySearch, esSuperAdmin } = validate(request);

    const collectionEntrevistas = context.functions.execute(
      "getCollectionInstance",
      "entrevistas"
    );

    const entrevistaPendiente = await collectionEntrevistas.findOne(
      querySearch
    );

    const isEntrevistaEmpresa = Boolean(entrevistaPendiente.empresa) && !esSuperAdmin;
    const collectionPostulantes = context.functions.execute(
      "getCollectionInstance",
      isEntrevistaEmpresa ? "postulante-empresa" : "propuestas"
    );
    const queryPostulante = !isEntrevistaEmpresa
      ? { _id: entrevistaPendiente?.postulante } // busca en la colección postulantes
      : { // busca en la colección postulante-empresa
          postulante: entrevistaPendiente?.postulante,
          empresa: entrevistaPendiente.empresa,
        };

    const postulanteData = await collectionPostulantes.findOne(
      queryPostulante,
      {
        password: 0,
        candidato: 0,
        sincronizadoCon: 0,
        perfil: 0,
        servicioAuth: 0,
        tokenVerificacion: 0,
        actualizadoPor: 0,
        creadoPor: 0,
      }
    );

    entrevistaPendiente.postulanteDoc = postulanteData;

    let entrevista = null;

    if (
      entrevistaPendiente?.fechaFinEntrevista &&
      Number(moment(entrevistaPendiente?.fechaFinEntrevista).format("x")) >
        Number(moment().format("x"))
    ) {
      entrevista = entrevistaPendiente;
    }

    context.functions.execute("handlerResponse", response, entrevista);
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
  const { query, headers } = request;
  const userSession = headers?.[context.values.get("jwt_config").headerUser];

  if (!query.postulanteId) throw new Error("El id del postulante es requerido");

  const querySearch = {
    postulante: BSON.ObjectId(query.postulanteId),
    deleted: { $ne: true },
    culminado: { $ne: true },
  };

  if (query.empresaId) {
    querySearch.empresa = BSON.ObjectId(query.empresaId);
  }

  return {
    querySearch,
    esSuperAdmin: Boolean(userSession?.isSuperAdmin)
  };
};
