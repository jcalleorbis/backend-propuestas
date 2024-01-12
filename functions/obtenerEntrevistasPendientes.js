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

    const moment = require("moment")
    const { querySearch } = validate(request);

    const collectionEntrevistas = context.functions.execute(
      "getCollectionInstance",
      "entrevistas"
    );
    const entrevistasPendientes = await collectionEntrevistas
      .find(querySearch)
      .toArray();

    const entrevistasFormateadas = [...(entrevistasPendientes || [])]?.map(
      (ent, i) => ({
        ...ent,
        orden: i + 1,
        enCurso:
          Boolean(
            ent.reclutador && ent.codigoAutorizacion && ent.fechaFinEntrevista
          ) &&
          Number(moment(ent.fechaFinEntrevista).format("x")) >
            Number(moment().format("x")),
      })
    );

    const entrevistasPobladas = await context.functions.execute(
      "populateDocuments",
      {
        results: entrevistasFormateadas,
        populateList: [
          {
            ref: "postulante",
            collection: "propuestas",
            fieldsOptions: {
              invitacionEdicion: 0,
              historialCambios: 0,
              invitacionesHistorial: 0,
            },
          },
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
          {
            ref: "asignadoPara",
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
          {
            ref: "reclutador",
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

    context.functions.execute("handlerResponse", response, entrevistasPobladas);
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
  const { query } = request
  const jwtConfig = context.values.get("jwt_config");

  let querySearch = {
    $or: [
      { // 0
        culminado: { $ne: true },
        asignadoPara: null, // todos
        deleted: { $ne: true }
      }
    ]
  };

  const sessionUser = request.headers?.[jwtConfig.headerUser];
  const queryEmpresa = context.functions.execute("obtenerFiltroEmpresa", request)

  querySearch.$or.push({ // 1
    culminado: { $ne: true },
    reclutador: sessionUser?._id,
    deleted: { $ne: true }
  })

  querySearch.$or.push({ // 2
    culminado: { $ne: true },
    asignadoPor: sessionUser?._id,
    deleted: { $ne: true }
  })

  querySearch.$or.push({
    culminado: { $ne: true },
    asignadoPara: sessionUser?._id,
    deleted: { $ne: true }
  })
  
  if(queryEmpresa) {
    querySearch.$or = querySearch.$or.map(option => ({ ...option, ...queryEmpresa }))
  }

  if(query.filtrarAsignados != 'false') {
    querySearch.$or.splice(0, 1)
    querySearch.$or.splice(1, 1)
    querySearch.$or.splice(2, 1)
  }

  if(query.isAdmin == 'true') {
    querySearch = {
      culminado: { $ne: true },
      deleted: { $ne: true }
    }
  }

  return {
    querySearch,
  };
};
