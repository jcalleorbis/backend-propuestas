exports = async function (request, response){
  try {

    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    await context.functions.execute("middlewareVerificarToken", request.headers, response)
    
    const collectionPerfiles = context.functions.execute("getCollectionInstance", "perfiles")

    const { document, documentId } = await validate(request, collectionPerfiles);
    
    const { matchedCount, modifiedCount } = await collectionPerfiles.updateOne({ _id: BSON.ObjectId(documentId) }, {
      $set: document
    })
    
    if (!matchedCount && !modifiedCount) throw new Error("No se encontró el perfil a editar");
    
    const perfilDocument = await collectionPerfiles.findOne({ _id: BSON.ObjectId(documentId) })
    
    context.functions.execute('handlerResponse', response, perfilDocument);
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
};

const validate = async (request, collection) => {
  const moment = require("moment")
  const body = JSON.parse(request.body.text())
  const jwtConfig = context.values.get("jwt_config")

  if(!body._id) throw new Error("El id del documento es requerido")
  if(!body.nombre) throw new Error("El nombre es requerido")
  if(!body.permitirTodo && (!body.accesos || body.accesos?.length == 0)) throw new Error("El perfil debe tener al menos 1 acceso")

  const existe = await context.functions.execute("validarPropiedadEnUso", { 
    collection: collection, 
    value: body.nombre,
    key: 'nombre',
    regexOptions: 'i',
    extraParams: {
      _id: { $ne: BSON.ObjectId(body._id) },
      deleted: { $ne: true }
    }
  })

  if(existe) throw new Error("El nombre del perfil ya existe")

  const sessionUser = request.headers?.[jwtConfig.headerUser]

  body.accesos = body.accesos?.map(access => {
    return {
      ...access,
      _id: BSON.ObjectId(access._id)
    }
  })

  return {
    documentId: body._id,
    document: {
      nombre: body.nombre?.trim() || "",
      descripcion: body.descripcion || "",
      permitirTodo: body.permitirTodo || false,
      accesos: body.accesos || [],
      esPublico: body.esPublico || false,
      fechaActualizacion: moment().toDate(),
      actualizadoPor: sessionUser?._id
    }
  }
}