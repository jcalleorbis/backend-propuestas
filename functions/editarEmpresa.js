exports = async function (request, response) {
  try {
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    await context.functions.execute("middlewareVerificarToken", request.headers, response)

    const { document, documentId } = await validate(request)

    const collectionEmpresas = context.functions.execute("getCollectionInstance", "empresas")

    const { modifiedCount } = await collectionEmpresas.updateOne({ _id: documentId }, {
      $set: document
    })

    if(!modifiedCount) throw new Error("No se pudo registrar la empresa")

    const empresa = await collectionEmpresas.findOne({ _id: documentId })

    context.functions.execute('handlerResponse', response, empresa);
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
}

const validate = async (request) => {
  const body = JSON.parse(request.body.text())
  const moment = require("moment")
  const jwtConfig = context.values.get("jwt_config")

  if(!body.empresaId) throw new Error("El id es requerido")
  if(!body.nombre) throw new Error("El nombre es requerido")
  if(!body.pais) throw new Error("El País es requerido")

  body.email = String(body.email).toLowerCase()

  const nuevoSku = await context.functions.execute("crearSkuEmpresa", {
    nombreEmpresa: body.nombre, 
    empresaId: body.empresaId
  })

  const sessionUser = request.headers?.[jwtConfig.headerUser]

  return {
    documentId: BSON.ObjectId(body.empresaId),
    document: {
      nombre: body.nombre,
      sku: nuevoSku,
      pais: body.pais,
      empleados: body.empleados || "",
      carpetas_drive: body.carpetas_drive || [],
      color_ficha: body.color_ficha,
      ficha: body.ficha,
      frase: body.frase || '',
      descripcion: body.descripcion || '',
      descripcionCorta: body.descripcionCorta || '',
      beneficios: body.beneficios || '',
      website: body.website || '',
      drive: body.drive || '',
      estructura_drive: body.estructura_drive || '',
      redes: body.redes || {},
      modificadoPor: sessionUser?._id,
      fechaModificacion: moment().toDate(),
    }
  }
}