exports = async function (request, response){
  try {

    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    await context.functions.execute("middlewareVerificarToken", request.headers, response)
    
    const payload = validate(request);

    const collectionPermisos = context.functions.execute("getCollectionInstance", "permisos")
    
    const existe = await collectionPermisos.findOne({ codigoRuta: payload.codigoRuta })
    if(existe) throw new Error("El código de ruta ya ha sido registrado")

    const { insertedId } = await collectionPermisos.insertOne(payload)

    if(!insertedId) throw new Error("Ocurrió un error insertando el nuevo permiso en la BD.")

    const permisoDocument = await collectionPermisos.findOne({ _id: insertedId })

    context.functions.execute('handlerResponse', response, permisoDocument);
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
};

const validate = (request) => {
  const body = JSON.parse(request.body.text())
  const moment = require("moment")
  const jwtConfig = context.values.get("jwt_config")

  if(!body.nombre) throw new Error("El nombre es requerido")
  if(!body.codigoRuta) throw new Error("El nombre es requerido")
  if(!body.acciones) throw new Error("Las acciones son requeridas")

  const sessionUser = request.headers?.[jwtConfig.headerUser]

  return {
    nombre: body.nombre || "",
    codigoRuta: body.codigoRuta || "",
    acciones: body.acciones || [],
    restricciones: body.restricciones || [],
    esRutaHija: body.esRutaHija || false,
    fechaRegistro: moment().toDate(),
    creadoPor: sessionUser?._id
  }
}