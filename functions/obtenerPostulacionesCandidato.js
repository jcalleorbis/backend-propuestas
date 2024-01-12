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

    const jwtConfig = context.values.get("jwt_config");
    const sessionUser = request.headers?.[jwtConfig.headerUser];

    const postulanteId = sessionUser?.sincronizadoCon?.identificador

    const collectionPostulaciones = context.functions.execute(
      "getCollectionInstance",
      "postulaciones"
    );

    const pipeline = [
      {
        $match: {
          postulante: postulanteId,
          deleted: { $ne: true }, 
        }
      },
      {
        $lookup: {
          from: "ofertas-empleo",
          localField: "oferta",
          foreignField: "_id",
          as: "oferta"
        }
      },
      {
        $lookup: {
          from: "postulante-empresa",
          localField: "postulanteEmpresa",
          foreignField: "_id",
          as: "postulanteEmpresa"
        }
      },
      {
        $lookup: {
          from: "empresas",
          localField: "empresa",
          foreignField: "_id",
          as: "empresa"
        }
      },
      {
        $unwind: "$empresa"
      },
      {
        $unwind: "$postulanteEmpresa"
      },
      {
        $unwind: "$oferta"
      },
      {
        "$project": {
          "oferta._id": 0,
          "oferta.creadoPor": 0,
          "oferta.actualizadoPor": 0,
          "postulanteEmpresa._id": 0,
          "postulanteEmpresa.skills": 0,
          "postulanteEmpresa.idiomas": 0,
          "postulanteEmpresa.historialEstatus": 0,
          "postulanteEmpresa.historialCambios": 0,
          "postulanteEmpresa.invitacionEdicion": 0,
          "postulanteEmpresa.invitacionesHistorial": 0,
          "postulanteEmpresa.creadorId": 0,
          "estatus": 0,
          "historialNotificaciones": 0,
        }
      },
      {
        $sort: {
          _id: -1
        }
      }
    ]

    const postulaciones = await collectionPostulaciones.aggregate(pipeline).toArray()

    context.functions.execute("handlerResponse", response, postulaciones);
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
