exports = async function (request, response) {
    try {
      await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
      await context.functions.execute("middlewareVerificarToken", request.headers, response)
  
      const { document, documentId } = await validate(request)
  
      const collectionClientes = context.functions.execute("getCollectionInstance", "clientes")
  
      const { modifiedCount } = await collectionClientes.updateOne({ _id: documentId }, {
        $set: document
      })
  
      if(!modifiedCount) throw new Error("No se pudo registrar la empresa")
  
      const cliente = await collectionClientes.findOne({ _id: documentId })
  
      context.functions.execute('handlerResponse', response, cliente);
    } catch (err) {
      context.functions.execute('handlerResponse', response, null, 400, false, err.message);
    }
  }
  
  const validate = (request) => {
    const body = JSON.parse(request.body.text())
    const moment = require("moment")

    if(!body.nombre) throw new Error("El nombre es requerido")
    if(!body.pais) throw new Error("El pais es requerido")
    if(!body.contrapartes) throw new Error("Las contrapartes son requeridas")

    const jwtConfig = context.values.get("jwt_config")
    const sessionUser = request.headers?.[jwtConfig.headerUser]
    
    return {
        documentId: BSON.ObjectId(body.clienteId),
        document: {
            nombre: body.nombre || "",
            pais: body.pais,
            contrapartes: body.contrapartes || [],
            fechaRegistro: moment().toDate(),
            modificadoPor: sessionUser?._id,
            fechaModificacion: moment().toDate(),
        }
    }
  }