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
      "validarPropuesta",
      JSON.parse(body.text())
    );

    const data = await validate({ ...query }, parseBody);

    let queryUpdate = { _id: BSON.ObjectId(data.propuestaId) };

    const collectionPropuestas = context.functions.execute(
      "getCollectionInstance",
      "propuestas"
    );

    const propuesta = await collectionPropuestas.findOne(queryUpdate);
    
    if(!propuesta) throw new Error("La propuesta no existe")

    if (propuesta?.deleted) { // si la propuesta está eliminada
      throw new Error(
        `La propuesta ${propuesta.email} no se pudo actualizar ya que se encuentra en estatus: 'eliminado'. Si desea reinsertarlo comuniquese con el administrador del sistema y proporcionele este ID: ${propuesta._id}`
      );
    }

    // Historial de estatus
    if (parseBody?.estatus && propuesta?.estatus) {
      if (parseBody.estatus.estado != propuesta.estatus.estado) {
        if (propuesta.historialEstatus) {
          parseBody.historialEstatus = [];
          parseBody.historialEstatus.push(...propuesta.historialEstatus, {
            estatus: propuesta.estatus,
            fechaFinalizacion: `${now().format()}`,
          });
          parseBody.estatus.comentarios = [];
        } else {
          parseBody.historialEstatus = [];
          parseBody.historialEstatus.push({
            estatus: propuesta.estatus,
            fechaFinalizacion: `${now().format()}`,
          });
          parseBody.estatus.comentarios = [];
        }
      }
    }

    // Historial de cambios
    const { fechaActualizacion, historialCambios } = getHistorialCambios(headers, propuesta, parseBody)

    parseBody.historialCambios = historialCambios;
    parseBody.fechaModificacion = fechaActualizacion;

    // Options & update
    const update = {
      $set: parseBody,
    };

    const options = { upsert: false };

    // se realiza una actualización completa en la empresa/administrador que añade los datos
    const { matchedCount, modifiedCount } =
      await collectionPropuestas.updateOne(queryUpdate, update, options);

    if (parseBody.empresa) {
      // Actualiza el candidato si está registrado en otras empresas, menos la actual
      await collectionPropuestas.updateMany(
        {
          propuesta: queryUpdate.propuesta,
          empresa: { $ne: queryUpdate.empresa },
        },
        {
          $set: formatearDataActualizacion(parseBody),
        },
        options
      );
      const collectionPropuestasOriginal = context.functions.execute(
        "getCollectionInstance",
        "propuestas"
      );
      await collectionPropuestasOriginal.updateOne(
        {
          _id: queryUpdate.propuesta,
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
      throw new Error("No se encontró propuesta a editar");
    }

    const propuestaAct = await collectionPropuestas.findOne(queryUpdate);

    context.functions.execute("handlerResponse", response, {
      ...propuestaAct,
      collectionName: "propuestas",
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

const validate = async ({ propuestaId }, propuestaInfo) => {
  if (!propuestaId) throw new Error("Debe añadir el propuestaId");
  return { propuestaId };
};

const getHistorialCambios = (headers, propuesta) => {
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

  const historialCambios = propuesta?.historialCambios
    ? [...propuesta.historialCambios, nuevaEdicion]
    : [nuevaEdicion];

  return {
    historialCambios,
    fechaActualizacion
  }
}

const formatearDataActualizacion = (propuesta) => {
  const now = require("moment");
  const propuestaClone = JSON.parse(JSON.stringify(propuesta));

  // eliminar propiedades que no se deben guardar en las otras empresas
  delete propuestaClone?.historialEstatus;
  delete propuestaClone?.historialCambios;
  delete propuestaClone?.invitacionEdicion;
  delete propuestaClone?.invitacionesHistorial;
  delete propuestaClone?.codigo;
  delete propuestaClone?.skills;
  delete propuestaClone?.idiomas;
  delete propuestaClone?.estatus;
  delete propuestaClone?.fechaRegistro;
  delete propuestaClone?.empresa;
  delete propuestaClone?.propuesta;
  delete propuestaClone?.preferenciaMoneda?.comentarios;
  delete propuestaClone?.creadorId;

  propuestaClone.fechaModificacion = now().toDate();

  return propuestaClone;
};
