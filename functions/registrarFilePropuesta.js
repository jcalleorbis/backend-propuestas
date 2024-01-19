exports = async function(request, response) {
  
  try {
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    const { query, headers, body } = request

    const contentType = validateContentType(headers);
    const data = validateQueries(query);

    const { type, propuestaId, basePath, collectionName, queryUpdate } = data

    const collectionPostulantes = context.functions.execute(
      "getCollectionInstance",
      collectionName
    );

    const postulante = await collectionPostulantes.findOne(queryUpdate)

    const folderId = postulante.folders.find((item)=> item.name == 'reserved_files_propuesta').id;

    if (!postulante) 
      context.functions.execute('handleError', "not_found", "El postulante no existe", 404);

    const filename = `${basePath}${type}_${postulante._id}${query.extension}`;
    
    const driveToken = query.token;
    
    const fileStr = await context.functions.execute('subirArchivoDrive', body.text(), filename, contentType, folderId, driveToken);

    
    const collectionUsuarios = context.functions.execute(
      "getCollectionInstance",
      "usuario"
    );

    const update = {
      $set: {
        [type]: `https://drive.google.com/file/d/${fileStr.data.id}`
      }
    };

    const options = { "upsert": false };

    const collectionPostulantesOriginal = context.functions.execute(
      "getCollectionInstance",
      "propuestas"
    );
    const collectionPostulantesEmpresa = context.functions.execute(
      "getCollectionInstance",
      "postulante-empresa"
    );
    
    // Se actualizan los datos del postulante en las colecciones "propuestas", "postulante-empresa" y "usuario.candidato"
    await collectionPostulantesEmpresa.updateMany({ postulante: queryUpdate._id || queryUpdate.postulante }, update, options);
    await collectionPostulantesOriginal.updateOne({ _id: queryUpdate._id || queryUpdate.postulante }, update, options);
    await collectionUsuarios.updateOne({ "sincronizadoCon.identificador": BSON.ObjectId(propuestaId), deleted: { $ne: true }  }, {
      $set: {
        [`candidato.${type}`]: fileStr
      }
    });

    const postulanteActualizado = await collectionPostulantes.findOne(queryUpdate)

    context.functions.execute('handlerResponse', response, postulanteActualizado);
  }
  catch (err) {
    context.functions.execute('handlerResponse', response, null, 500, false, err.message);
  }
};

const validateContentType = (headers) => {
  const contentType = headers["Content-Type"];
  return contentType[0];
};

const validateQueries = ({propuestaId, type}) => {
  if (!propuestaId) context.functions.execute('handleError', "validation_error", "El ID es requerido", 400);
  if (!type) context.functions.execute('handleError', "validation_error", "Se debe especificar el tipo", 400);

  const collectionName = 'propuestas'
  
  let queryUpdate = {
    _id: BSON.ObjectId(propuestaId)
  }

  const basePath = '' /*En caso de que se desee segmentar por empresas empresaId ? `empresas/${empresaId}/postulantes/` : '' */

  return {propuestaId, type, collectionName, queryUpdate, basePath };
};
