exports = async function(request, response) {
  const moment = require('moment-timezone');
  try {
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)

    const recappConfig = context.values.get("recapp_config")
    const { query, headers, body } = request

    const folderGroup = recappConfig["folder_users_group"]

    const contentType = validateContentType(headers);
    const data = validateQueries(query);
    const { folder, usuarioId, removerActual } = data

    const usuario = await context.functions.execute('obtenerDocumentoPorQuery', {
      query: {
        _id: BSON.ObjectId(usuarioId)
      },
      collectionName: 'usuario'
    });

    if (!usuario) throw new Error("La cuenta del usuario no existe")
      
    const today = moment().format('YYYY_MM_DD_HH_mm_ss');
    const filename = `${folderGroup}/${usuarioId}/${folder}/${today}`;
    
    const fileStr = await context.functions.execute('gcpUploadFileStorage', filename, contentType, body.text());

    const collectionUsuarios = context.functions.execute(
      "getCollectionInstance",
      "usuario"
    );
    
    const { matchedCount, modifiedCount  } = await collectionUsuarios.updateOne({ _id: BSON.ObjectId(usuarioId) }, {
      $set: {
        [folder]: fileStr
      }
    });

    if (!matchedCount && !modifiedCount) throw new Error("No se pudo actualizar, inténtelo nuevamente.");

    if(removerActual && usuario[folder]) {
      await context.functions.execute("gcpRemoveFileStorage", usuario[folder])
    }

    context.functions.execute('handlerResponse', response, {
      updated: Boolean(modifiedCount)
    });
  }
  catch (err) {
    context.functions.execute('handlerResponse', response, null, 500, false, err.message);
  }
};

const validateContentType = (headers) => {
  const types = ["image/png", "image/jpg", "image/jpeg"]
  const contentType = headers["Content-Type"];
  if(!types.includes(contentType[0])) {
    context.functions.execute('handleError', "validation_error", `No se soporta el tipo de archivo ${contentType[0]}`, 400);
  }
  return contentType[0];
};

const validateQueries = ({ usuarioId, folder, removerActual = false}) => {
  if (! usuarioId) context.functions.execute('handleError', "validation_error", "El ID es requerido", 400);
  if (!folder) context.functions.execute('handleError', "validation_error", "Se debe especificar la carpeta de destino", 400);
  return { 
    usuarioId, 
    folder, 
    removerActual: 
    removerActual || false
  };
};
