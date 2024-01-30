exports = async function (request, response) {
  try {
    const { query, headers, body } = request;

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

    if (!body.text())
      throw new Error("No se esta enviando el body en el request");

      const driveToken = JSON.parse(body.text()).token
    const parseBody = await context.functions.execute(
      "validarPropuesta",
      JSON.parse(body.text())
    );

    const createFolders = parseBody.createFolders;
    
    const collectionPropuestas = context.functions.execute(
      "getCollectionInstance",
      "propuestas"
    );

    const collectionUser = context.services
      .get('mongodb-atlas')
      .db(context.environment.values.DB_NAME)
      .collection('usuario');
  
    let queryUsuario = {
      _id: parseBody.creadorId,
    }

    const userFound = await collectionUser.findOne(queryUsuario);

    // Se añade código incrementable al postulante
    const dtoPropuesta = {
      ...parseBody,
      codigo: await context.functions.execute(
        "obtenerSiguienteCodigoPropuesta"
      ),
      empresa: userFound.empresa
    };

    const { insertedId } = await collectionPropuestas.insertOne(dtoPropuesta);

    // Se valida el resultado
    if (!insertedId) {
      throw new Error("No se encontró propuesta a agregar");
    }

    let propuesta = await context.functions.execute(
      "findPostulantePorId",
      `${insertedId}`
    );

    //Creación de carpeta

    //ID de la empresa

    const enterpriseId = propuesta.empresa;

    const collectionEnterprises = context.services
      .get('mongodb-atlas')
      .db(context.environment.values.DB_NAME)
      .collection('empresas');
  
    let queryEnterprise = {
      _id: enterpriseId,
    }

    const enterpriseFound = await collectionEnterprises.findOne(queryEnterprise);

    //
    if(enterpriseFound.drive && enterpriseFound.carpetas_drive){
      //Get the google drive token
      //Get the main folderId
      const mainFolderId = enterpriseFound.drive.split('?')[0].split('/').pop();
      //Create the new folder
      const createdFolder = await context.functions.execute("crearCarpetaDrive", [`${propuesta._id}_${propuesta.alias}`], mainFolderId, driveToken);
      if(createdFolder.status !== 401){
        
        let folders = enterpriseFound.carpetas_drive.map((item)=> {
          return item.nombre;
        });

        if(!createFolders) folders = enterpriseFound.carpetas_drive.filter((item)=>item.isFileUploaded == true).map((item)=>{return item.nombre});

        const driveResponse = await context.functions.execute("crearCarpetaDrive", folders, createdFolder.data[0].id, driveToken);
        
        const foldersSaved = driveResponse.data.map((item)=>{
          return {
            id: item.id,
            name: item.folderName,
            updateFiles: enterpriseFound.carpetas_drive.find((current)=> current.nombre == item.folderName).isFileUploaded
          }
        });

        //Update the folders in the register
        const { modifiedCount } = await collectionPropuestas.updateOne({ _id: propuesta._id }, {
          $set: {
            ...propuesta,
            repo_google_drive: `https://drive.google.com/drive/folders/${createdFolder.data[0].id}`,
            folders: foldersSaved
          }
        })

        if(!modifiedCount) throw new Error("No se pudo actualizar la propuesta en drive")
  
        propuesta = await collectionPropuestas.findOne({ _id: propuesta._id })

      } else {
        context.functions.execute(
          "handlerResponse",
          response,
          null,
          401,
          false,
          "Unauthorized"
        );
      }

    }

    context.functions.execute("handlerResponse", response, propuesta);
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
