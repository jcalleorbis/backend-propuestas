exports = async function(request, response) {
  const moment = require('moment-timezone');
  try {
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    const { query, headers, body } = request

    const contentType = validateContentType(headers);
    const data = validateQueries(query);

    const { folder, postulanteId, removerActual, basePath, collectionName, queryUpdate } = data

    const collectionPostulantes = context.functions.execute(
      "getCollectionInstance",
      collectionName
    );

    const postulante = await collectionPostulantes.findOne(queryUpdate)

    if (!postulante) 
      context.functions.execute('handleError', "not_found", "El postulante no existe", 404);

    const today = moment().format('YYYY_MM_DD_HH_mm_ss');
    const nombreCompleto = `${postulante.nombres || ''} ${postulante.apellidoPaterno || ''} ${postulante.apellidoMaterno || ''}`.trim()
    const filename = `${basePath}${postulante._id}/${folder}/${nombreCompleto.replace(/ /g, '_')}_${today}`;
    
    const fileStr = await context.functions.execute('gcpUploadFileStorage', filename, contentType, body.text());
    
    const collectionUsuarios = context.functions.execute(
      "getCollectionInstance",
      "usuario"
    );

    const update = {
      $set: {
        [folder]: fileStr
      }
    };

    const options = { "upsert": false };

    const collectionPostulantesOriginal = context.functions.execute(
      "getCollectionInstance",
      "postulantes"
    );
    const collectionPostulantesEmpresa = context.functions.execute(
      "getCollectionInstance",
      "postulante-empresa"
    );
    
    // Se actualizan los datos del postulante en las colecciones "postulantes", "postulante-empresa" y "usuario.candidato"
    await collectionPostulantesEmpresa.updateMany({ postulante: queryUpdate._id || queryUpdate.postulante }, update, options);
    await collectionPostulantesOriginal.updateOne({ _id: queryUpdate._id || queryUpdate.postulante }, update, options);
    await collectionUsuarios.updateOne({ "sincronizadoCon.identificador": BSON.ObjectId(postulanteId), deleted: { $ne: true }  }, {
      $set: {
        [`candidato.${folder}`]: fileStr
      }
    });

    if(removerActual && postulante[folder]) {
      await context.functions.execute("gcpRemoveFileStorage", postulante[folder])
    }

    const postulanteActualizado = await collectionPostulantes.findOne(queryUpdate)

    context.functions.execute('handlerResponse', response, postulanteActualizado);
  }
  catch (err) {
    context.functions.execute('handlerResponse', response, null, 500, false, err.message);
  }
};

const validateContentType = (headers) => {
  const contentType = headers["Content-Type"];
  if(contentType[0] !== "application/pdf" && contentType[0] !== "video/mp4") {
    context.functions.execute('handleError', "validation_error", `No se soporta el tipo de archivo ${contentType[0]}`, 400);
  }
  return contentType[0];
};

const validateQueries = ({postulanteId, folder, removerActual = false, empresaId = '' }) => {
  if (!postulanteId) context.functions.execute('handleError', "validation_error", "El ID es requerido", 400);
  if (!folder) context.functions.execute('handleError', "validation_error", "Se debe especificar la carpeta de destino", 400);

  const collectionName = empresaId ? 'postulante-empresa' : 'postulantes'
  
  let queryUpdate = {
    _id: BSON.ObjectId(postulanteId)
  }

  if(empresaId) {
    queryUpdate = {
      empresa: BSON.ObjectId(empresaId),
      postulante: BSON.ObjectId(postulanteId)
    }
  }

  const basePath = '' /*En caso de que se desee segmentar por empresas empresaId ? `empresas/${empresaId}/postulantes/` : '' */

  return {postulanteId, folder, removerActual: removerActual || false, empresaId, collectionName, queryUpdate, basePath };
};
