exports = async function (request, response){
  try {

    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    await context.functions.execute("middlewareVerificarToken", request.headers, response)
    
    const collectionConceptos = context.functions.execute("getCollectionInstance", "conceptos")
    const payload = await validate(request, collectionConceptos);

    const { insertedId } = await collectionConceptos.insertOne(payload)

    if(!insertedId) throw new Error("Ocurrió un error al intentar guardar el conocimiento en la BD.")

    const conceptoDocument = await collectionConceptos.findOne({ _id: insertedId })

    context.functions.execute('handlerResponse', response, conceptoDocument);
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
};

const validate = async (request, collection) => {
  const body = JSON.parse(request.body.text())
  const moment = require("moment")
  const jwtConfig = context.values.get("jwt_config")

  if(!body.nombre) throw new Error("El nombre es requerido")
  if(!body.color) throw new Error("El color es requerido")
  if(!body.tipo || typeof body.tipo != 'object') throw new Error("La Agrupación de Conocimiento es requerida")
  
  const existe = await context.functions.execute("validarPropiedadEnUso", { 
    collection: collection, 
    value: body.nombre,
    key: 'nombre',
    regexOptions: "i",
    extraParams: {
      deleted: { $ne: true }
    }
  })

  if(existe) throw new Error("El nombre proporcionado ya existe")

  const sessionUser = request.headers?.[jwtConfig.headerUser]

  body.tipo = {
    ...body.tipo,
    _id: BSON.ObjectId(body.tipo?._id)
  }

  return {
    nombre: body.nombre?.trim() || "",
    icon: body.icon || "",
    tipo: body.tipo,
    color: body.color || false,
    fechaRegistro: moment().toDate(),
    creadoPor: sessionUser?._id
  }
}