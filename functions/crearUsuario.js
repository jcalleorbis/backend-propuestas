

exports = async function (request, response) {
  try {

    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    await context.functions.execute("middlewareVerificarToken", request.headers, response)
    
    const collectionUsuarios = context.functions.execute("getCollectionInstance", "usuario")

    const payload = await validate(request, collectionUsuarios);

    const { insertedId } = await collectionUsuarios.insertOne(payload)

    if(!insertedId) throw new Error("Ocurrió un error insertando el nuevo usuario en la BD.")

    const usuarioDocument = await collectionUsuarios.findOne({ _id: insertedId })

    context.functions.execute('handlerResponse', response, usuarioDocument);
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
}

const validate = async (request, collectionUsuarios) => {
  const body = JSON.parse(request.body.text())
  const moment = require("moment")
  const passwordHash = require('password-hash');
  const jwtConfig = context.values.get("jwt_config")
  const recappConfig = context.values.get("recapp_config");

  if(!body.email) throw new Error("El Email es requerido")
  if(!body.password) throw new Error("La contraseña es requerida")
  if(!body.perfil) throw new Error("El perfil es requerido")
  
  body.email = String(body.email).toLowerCase()?.trim()

  const mailInUse = await context.functions.execute("validarPropiedadEnUso", { 
    collection: collectionUsuarios, 
    value: body.email,
    key: 'email',
    extraParams: {
      deleted: {
        $ne: true
      }
    }
  })
  
  if(mailInUse) throw new Error("El Email se encuentra en uso")
  
  const hashedPassword = await passwordHash.generate(body.password)
  const sessionUser = request.headers?.[jwtConfig.headerUser]

  if(body.empresa) {
    body.empresa = BSON.ObjectId(body.empresa)
  }

  return {
    email: body.email,
    password: hashedPassword,
    perfil: BSON.ObjectId(body.perfil),
    tipoAuth: recappConfig.tipo_auth_default,
    activo: body.activo || false,
    empresa: body.empresa || sessionUser.empresa || null,
    fechaCreacion: moment().toDate(),
    creadoPor: sessionUser?._id
  }
}