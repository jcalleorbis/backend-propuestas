exports = async function (request, response){
  try {

    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    await context.functions.execute("middlewareVerificarToken", request.headers, response)
    
    const collectionPerfiles = context.functions.execute("getCollectionInstance", "perfiles")
    
    const payload = await validate(request, collectionPerfiles);

    const { insertedId } = await collectionPerfiles.insertOne(payload)

    if(!insertedId) throw new Error("Ocurrió un error insertando el nuevo perfil en la BD.")

    const perfilDocument = await collectionPerfiles.findOne({ _id: insertedId })

    context.functions.execute('handlerResponse', response, perfilDocument);
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
};

const validate = async (request, collection) => {
  const body = JSON.parse(request.body.text())
  const moment = require("moment")
  const jwtConfig = context.values.get("jwt_config")

  if(!body.nombre) throw new Error("El nombre es requerido")
  if(!body.permitirTodo && (!body.accesos || body.accesos?.length == 0)) throw new Error("El perfil debe tener al menos 1 acceso")
  
  const existe = await context.functions.execute("validarPropiedadEnUso", { 
    collection: collection, 
    value: body.nombre,
    key: 'nombre',
    regexOptions: 'i',
    extraParams: {
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
    nombre: body.nombre?.trim() || "",
    descripcion: body.descripcion || "",
    permitirTodo: body.permitirTodo || false,
    accesos: body.accesos || [],
    esPublico: body.esPublico || false,
    fechaRegistro: moment().toDate(),
    creadoPor: sessionUser?._id
  }
}