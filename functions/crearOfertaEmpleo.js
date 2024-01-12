
exports = async function (request, response) {
  try {
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    await context.functions.execute("middlewareVerificarToken", request.headers, response)

    const payload = await validate(request)

    const collectionOfertasEmpleo = context.functions.execute("getCollectionInstance", "ofertas-empleo")
    const { insertedId } = await collectionOfertasEmpleo.insertOne(payload)

    if(!insertedId) 
      throw new Error ('Ocurrió un error y no se pudo añadir la nueva oferta de empleo');

    context.functions.execute('handlerResponse', response, {
      creado: true,
      id: insertedId
    });
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
}

const validate = async (request) => {
  const body = JSON.parse(request.body.text())
  const moment = require("moment")
  const jwtConfig = context.values.get("jwt_config")

  const bodyEmpleo = await context.functions.execute("validarOfertaEmpleo", body)
  
  const sessionUser = request.headers?.[jwtConfig.headerUser]
  
  return {
    ...bodyEmpleo,
    creadoPor: sessionUser?._id,
    fechaRegistro: moment().toDate(),
  }
}