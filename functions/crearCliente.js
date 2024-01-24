exports = async function (request, response){
    try {
  
      await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
      await context.functions.execute("middlewareVerificarToken", request.headers, response)
      
      const payload = validate(request);
  
      const collectionPermisos = context.functions.execute("getCollectionInstance", "clientes")
  
      const { insertedId } = await collectionPermisos.insertOne(payload)
  
      if(!insertedId) throw new Error("Ocurrió un error insertando el nuevo cliente en la BD.")
  
      const permisoDocument = await collectionPermisos.findOne({ _id: insertedId })
  
      context.functions.execute('handlerResponse', response, permisoDocument);
    } catch (err) {
      context.functions.execute('handlerResponse', response, null, 400, false, err.message);
    }
  };
  
  const validate = (request) => {
    const body = JSON.parse(request.body.text())
    const moment = require("moment")

    if(!body.nombre) throw new Error("El nombre es requerido")
    if(!body.pais) throw new Error("El pais es requerido")
    if(!body.contrapartes) throw new Error("Las contrapartes son requeridas")

    const jwtConfig = context.values.get("jwt_config")
    const sessionUser = request.headers?.[jwtConfig.headerUser]
    
    return {
      nombre: body.nombre || "",
      pais: body.pais,
      contrapartes: body.contrapartes || [],
      fechaRegistro: moment().toDate(),
      creadoPor: sessionUser?._id
    }
  }