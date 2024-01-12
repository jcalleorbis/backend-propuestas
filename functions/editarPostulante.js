exports = async function (request, response) {
  try {
    const { query, headers, body } = request;

    // middleware validación token & origen
    await context.functions.execute(
      "middlewareVerificarOrigenClientId",
      request,
      response
    );
    await context.functions.execute(
      "middlewareVerificarToken",
      headers,
      response
    );

    const now = require("moment");

    if (!body.text())
      throw new Error("No se esta enviando el body en el request");

    const parseBody = await context.functions.execute(
      "validarPostulante",
      JSON.parse(body.text())
    );

    const data = await validate({ ...query }, parseBody);

    let queryUpdate = { _id: BSON.ObjectId(data.postulanteId) };

    const collectionPostulantes = context.functions.execute(
      "getCollectionInstance",
      "postulantes"
    );

    const postulante = await collectionPostulantes.findOne(queryUpdate);
    
    if(!postulante) throw new Error("El postulante no existe")

    if (postulante?.deleted) { // si el postulante está eliminado
      throw new Error(
        `El postulante ${postulante.email} no se pudo actualizar ya que se encuentra en estatus: 'eliminado'. Si desea reinsertarlo comuniquese con el administrador del sistema y proporcionele este ID: ${postulante._id}`
      );
    }

    // Historial de estatus
    if (parseBody?.estatus && postulante?.estatus) {
      if (parseBody.estatus.estado != postulante.estatus.estado) {
        if (postulante.historialEstatus) {
          parseBody.historialEstatus = [];
          parseBody.historialEstatus.push(...postulante.historialEstatus, {
            estatus: postulante.estatus,
            fechaFinalizacion: `${now().format()}`,
          });
          parseBody.estatus.comentarios = [];
        } else {
          parseBody.historialEstatus = [];
          parseBody.historialEstatus.push({
            estatus: postulante.estatus,
            fechaFinalizacion: `${now().format()}`,
          });
          parseBody.estatus.comentarios = [];
        }
      }
    }

    // Historial de cambios
    const { fechaActualizacion, historialCambios } = getHistorialCambios(headers, postulante, parseBody)

    parseBody.historialCambios = historialCambios;
    parseBody.fechaModificacion = fechaActualizacion;

    // Options & update
    const update = {
      $set: parseBody,
    };

    const options = { upsert: false };

    // se realiza una actualización completa en la empresa/administrador que añade los datos
    const { matchedCount, modifiedCount } =
      await collectionPostulantes.updateOne(queryUpdate, update, options);

    if (parseBody.empresa) {
      // Actualiza el candidato si está registrado en otras empresas, menos la actual
      await collectionPostulantes.updateMany(
        {
          postulante: queryUpdate.postulante,
          empresa: { $ne: queryUpdate.empresa },
        },
        {
          $set: formatearDataActualizacion(parseBody),
        },
        options
      );
      const collectionPostulantesOriginal = context.functions.execute(
        "getCollectionInstance",
        "postulantes"
      );
      await collectionPostulantesOriginal.updateOne(
        {
          _id: queryUpdate.postulante,
        },
        {
          $set: formatearDataActualizacion(parseBody),
          $push: { historialCambios: historialCambios[historialCambios.length-1]  }
        },
        options
      );
    } else {
      // Actualiza la data de todas las empresas que tengan al candidato
      const collectionPostulanteEmpresa = context.functions.execute(
        "getCollectionInstance",
        "postulante-empresa"
      );
      await collectionPostulanteEmpresa.updateMany(
        {
          postulante: queryUpdate._id,
        },
        {
          $set: formatearDataActualizacion(parseBody),
        },
        options
      );
    }

    // Se valida el resultado
    if (!matchedCount && !modifiedCount) {
      throw new Error("No se encontró postulante a editar");
    }

    const postulanteAct = await collectionPostulantes.findOne(queryUpdate);

    context.functions.execute("handlerResponse", response, {
      ...postulanteAct,
      collectionName: "postulantes",
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

const validate = async ({ postulanteId }, postulanteInfo) => {
  if (!postulanteId) throw new Error("Debe añadir el postulanteId");
  // Validar Email en uso
  const idOnPostulantes = BSON.ObjectId(postulanteId)
  const email = postulanteInfo.email
  return { postulanteId };
};

const getHistorialCambios = (headers, postulante) => {
  const now = require("moment");
  const userSession = headers?.[context.values.get("jwt_config").headerUser];
  const fechaActualizacion = now().toDate();

  const nuevaEdicion = {
    fechaModificacion: fechaActualizacion,
    usuario: {
      id: userSession?._id,
      email: userSession?.email,
    },
  };

  if(userSession.empresa) {
    nuevaEdicion.empresa =  {
      descripcion: userSession.empresaDoc?.nombre,
      id: userSession.empresaDoc?._id,
    }
  }

  const historialCambios = postulante?.historialCambios
    ? [...postulante.historialCambios, nuevaEdicion]
    : [nuevaEdicion];

  return {
    historialCambios,
    fechaActualizacion
  }
}

const formatearDataActualizacion = (postulante) => {
  const now = require("moment");
  const postulanteClone = JSON.parse(JSON.stringify(postulante));

  // eliminar propiedades que no se deben guardar en las otras empresas
  delete postulanteClone?.historialEstatus;
  delete postulanteClone?.historialCambios;
  delete postulanteClone?.invitacionEdicion;
  delete postulanteClone?.invitacionesHistorial;
  delete postulanteClone?.codigo;
  delete postulanteClone?.skills;
  delete postulanteClone?.idiomas;
  delete postulanteClone?.estatus;
  delete postulanteClone?.fechaRegistro;
  delete postulanteClone?.empresa;
  delete postulanteClone?.postulante;
  delete postulanteClone?.preferenciaMoneda?.comentarios;
  delete postulanteClone?.creadorId;

  postulanteClone.fechaModificacion = now().toDate();

  return postulanteClone;
};
