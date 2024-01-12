exports = async (request, response) => {
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

    const { payload, candidato, oferta, empresa } = await validate(request);

    const collectionPostulaciones = context.functions.execute(
      "getCollectionInstance",
      "postulaciones"
    );

    const { insertedId } = await collectionPostulaciones.insertOne(payload);

    if (!insertedId)
      throw new Error(
        "No se pudo registrar su postulación, vuelva a intentarlo nuevamente."
      );

    const postulanteEmpresaId = await context.functions.execute(
      "insertarPostulanteEmpresa",
      payload.postulante,
      payload.empresa,
      candidato
    );

    await collectionPostulaciones.updateOne({ _id: insertedId }, {
      $set: {
        postulanteEmpresa: postulanteEmpresaId
      }
    });

    empresa.email && await context.functions.execute("enviarCorreo", {
      to: empresa.email,
      subject: `Nueva postulación - ${oferta.titulo}`,
      html: getHtmlNotificacionOferta({
        fechaPostulacion: payload.fechaPostulacion,
        nombresYApellidos: `${candidato.nombres} ${candidato.apellidoPaterno} ${candidato.apellidoMaterno}`,
        tituloOferta:  oferta.titulo,
        emailPostulacion: candidato.email,
      }),
      account: 'noreply_account'
    });

    context.functions.execute("handlerResponse", response, {
      postulacionId: insertedId,
      creado: Boolean(insertedId),
      registroEmpresa: postulanteEmpresaId,
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


const getHtmlNotificacionOferta = ({ nombresYApellidos, tituloOferta, fechaPostulacion, emailPostulacion }) => {
  return `
  <div
    style="
      background-color: #eee;
      padding: 20px;
      width: 100%;
      height: 100%;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      box-sizing: border-box;
    "
  >
    <div
      style="
        margin: auto;
        background: #fff;
        padding: 15px 20px;
        box-sizing: border-box;
        max-width: 600px;
      "
    >
      <h4 style="padding: 10px 0">Nueva postulación</h4>
      <div style="border-bottom: 1px solid #eee; margin-bottom: 10px;"></div>
      
      <table style="width: 100%; max-width: 400px;">
        <tbody>
          <tr>
            <td style="padding-right: 5px">
              <span style="font-weight: 600; white-space: nowrap"
                >Proceso :</span
              >
            </td>
            <td>
              <span style="font-size: 20px; font-weight: 500;">${tituloOferta}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-right: 5px">
              <span style="font-weight: 600; white-space: nowrap"
                >Candidato :</span
              >
            </td>
            <td>
              <span style="font-size: 20px; font-weight: 500;">${nombresYApellidos}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-right: 5px">
              <span style="font-weight: 600; white-space: nowrap"
                >Email :</span
              >
            </td>
            <td>
              <span style="font-size: 20px; font-weight: 500;">${emailPostulacion}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-right: 5px">
              <span style="font-weight: 600; white-space: nowrap"
                >Fecha Postulación. :</span
              >
            </td>
            <td>
              <span style="font-size: 20px; font-weight: 500;">${fechaPostulacion}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
`;

}

const validate = async (request) => {
  const body = JSON.parse(request.body.text());
  const moment = require("moment");
  const jwtConfig = context.values.get("jwt_config");
  const recappConfig = context.values.get("recapp_config");

  const sessionUser = request.headers?.[jwtConfig.headerUser];
  const postulanteId = sessionUser?.sincronizadoCon?.identificador;

  if (!sessionUser) throw new Error("El postulante es requerido");

  if (!sessionUser.candidato)
    throw new Error(
      "No se encontró un perfil de candidato asociado a la cuenta que solicita la postulación"
    );

  if (!postulanteId)
    throw new Error(
      "No se encontró un perfil de candidato asociado a la cuenta que solicita la postulación"
    );

  if (!body.oferta) throw new Error("La oferta es requerida");

  if (!body.empresa) throw new Error("La Empresa es requerida");

  const oferta = await context.functions.execute(
    "obtenerDocumentoPorQuery",
    {
      query: {
        _id: BSON.ObjectId(body.oferta),
      },
      collectionName: "ofertas-empleo",
    }
  );

  if(!oferta) throw new Error("La oferta laboral ha sido removida. Por favor, refresca la página.")

  const empresa = await context.functions.execute(
    "obtenerDocumentoPorQuery",
    {
      query: {
        _id: BSON.ObjectId(body.empresa),
      },
      collectionName: "empresas",
    }
  );

  const postulacionPrevia = await context.functions.execute(
    "obtenerDocumentoPorQuery",
    {
      query: {
        oferta: BSON.ObjectId(body.oferta),
        postulante: postulanteId,
        deleted: { $ne: true },
      },
      collectionName: "postulaciones",
    }
  );

  const estado = await context.functions.execute(
    "obtenerDocumentoPorQuery", 
    {
      query: { _id: BSON.ObjectId(recappConfig.estado_id_por_contactar)  },
      collectionName: "estados-postulante"
    }
  )

  if(!estado) throw new Error("Error de configuración: No se añadió un estado por defecto para las postulaciones.");
  if (postulacionPrevia) throw new Error("Ya has postulado a esta oferta");

  return {
    payload: {
      postulante: postulanteId,
      oferta: BSON.ObjectId(body.oferta),
      empresa: BSON.ObjectId(body.empresa),
      resumen: body.resumen || "",
      interesPostulacion: body.interesPostulacion || "",
      enviado: true,
      estatus: estado,
      fechaPostulacion: moment().toDate(),
    },
    candidato: sessionUser.candidato,
    oferta: oferta,
    empresa: empresa,
  };
};
