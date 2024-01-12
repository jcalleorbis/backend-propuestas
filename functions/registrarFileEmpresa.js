exports = async function(request, response) {
  const moment = require('moment-timezone');
  try {
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    await context.functions.execute("middlewareVerificarToken", request.headers, response)

    const recappConfig = context.values.get("recapp_config")
    const { query, headers, body } = request

    const folderGroup = recappConfig["folder_companies_group"]

    const contentType = validateContentType(headers);
    const data = validateQueries(query);

    const { folder, empresaId, removerActual } = data

    const empresa = await context.functions.execute('obtenerDocumentoPorQuery', {
      query: {
        _id: BSON.ObjectId(empresaId)
      },
      collectionName: 'empresas'
    });

    if (!empresa) throw new Error("La empresa no existe")
      
    const today = moment().format('YYYY_MM_DD_HH_mm_ss');
    const filename = `${folderGroup}/${empresaId}/${folder}/${today}`;
    
    const fileStr = await context.functions.execute('gcpUploadFileStorage', filename, contentType, body.text());

    const collectionEmpresas = context.functions.execute(
      "getCollectionInstance",
      "empresas"
    );
    
    const { matchedCount, modifiedCount  } = await collectionEmpresas.updateOne({ _id: BSON.ObjectId(empresaId) }, {
      $set: {
        [folder]: fileStr
      }
    });

    if (!matchedCount && !modifiedCount) throw new Error("No se pudo actualizar, inténtelo nuevamente.");

    if(removerActual && empresa[folder]) {
      await context.functions.execute("gcpRemoveFileStorage", empresa[folder])
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

const validateQueries = ({ empresaId, folder, removerActual = false}) => {
  if (! empresaId) context.functions.execute('handleError', "validation_error", "El ID es requerido", 400);
  if (!folder) context.functions.execute('handleError', "validation_error", "Se debe especificar la carpeta de destino", 400);
  return { 
    empresaId, 
    folder, 
    removerActual: 
    removerActual || false
  };
};
