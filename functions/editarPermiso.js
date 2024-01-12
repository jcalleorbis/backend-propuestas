exports = async function (request, response){
  try {

    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    await context.functions.execute("middlewareVerificarToken", request.headers, response)
    
    const { document, documentId } = validate(request);
    
    const collectionPermisos = context.functions.execute("getCollectionInstance", "permisos")
    
    const existe = await collectionPermisos.findOne({ codigoRuta: document.codigoRuta, _id: { "$ne": BSON.ObjectId(documentId) } })
    if(existe) throw new Error("El código de ruta al que pretendes modificar ya ha sido registrado")
    
    const { matchedCount, modifiedCount } = await collectionPermisos.updateOne({ _id: BSON.ObjectId(documentId) }, {
      $set: document
    })
    
    if (!matchedCount && !modifiedCount) throw new Error("No se encontró el permiso a editar");
    
    const permisoDocument = await collectionPermisos.findOne({ _id: BSON.ObjectId(documentId) })
    
    context.functions.execute('handlerResponse', response, permisoDocument);
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
};

const validate = (request) => {
  const moment = require("moment")
  const body = JSON.parse(request.body.text())
  const jwtConfig = context.values.get("jwt_config")

  if(!body._id) throw new Error("El id del documento es requerido")
  if(!body.nombre) throw new Error("El nombre es requerido")
  if(!body.codigoRuta) throw new Error("El código de ruta es requerido")
  if(!body.acciones) throw new Error("Las acciones son requeridas")

  const sessionUser = request.headers?.[jwtConfig.headerUser]

  return {
    documentId: body._id,
    document: {
      nombre: body.nombre || "",
      codigoRuta: body.codigoRuta || "",
      acciones: body.acciones || [],
      restricciones: body.restricciones || [],
      esRutaHija: body.esRutaHija || false,
      fechaActualizacion: moment().toDate(),
      actualizadoPor: sessionUser?._id
    }
  }
}