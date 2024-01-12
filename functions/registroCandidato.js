exports = async function (request, response) {
  try {
    //await context.functions.execute("middlewareVerificarOrigenClientId", request, response)

    const collectionUsuarios = context.functions.execute(
      "getCollectionInstance",
      "usuario"
    );

    const payload = await validate(request, collectionUsuarios);

    const { insertedId } = await collectionUsuarios.insertOne(payload);

    if (!insertedId) throw new Error("Ocurrió un error registrando sus datos.");

    context.functions.execute("handlerResponse", response, {
      registro: true,
      email: payload.email,
      // usuarioId: insertedId
    });
  } catch (err) {
    context.functions.execute(
      "handlerResponse",
      response,
      null,
      400,
      false,
      err.message
    );
  }
};

const validate = async (request, collection) => {
  const body = JSON.parse(request.body.text());
  const passwordConfig = context.values.get("password_config");
  const recappConfig = context.values.get("recapp_config");
  const passwordHash = require("password-hash");
  const moment = require("moment");

  if (!body.email) throw new Error("El email es requerido");

  if (!body.tipoAuth) throw new Error("El tipo de autenticación es requerido");

  if (!body.aceptaTerminosYCondiciones)
    throw new Error("Debes aceptar los Términos y Condiciones");

  if (body.tipoAuth == recappConfig.tipo_auth_default) {
    if (!body.password) throw new Error(`La contraseña es requerida`);

    if (body.password.length < passwordConfig.min)
      throw new Error(
        `La contraseña debe tener ${passwordConfig.min} caracteres como mínimo`
      );

    body.password = await passwordHash.generate(body.password);
  }

  if (body.tipoAuth !== recappConfig.tipo_auth_default && body.servicioAuth) {
    body.verificado = true;
  }

  body.email = String(body.email).toLowerCase().trim();

  const mailInUse = await context.functions.execute("validarPropiedadEnUso", {
    collection: collection,
    value: body.email,
    key: "email",
    extraParams: {
      deleted: {
        $ne: true
      }
    }
  });

  if (mailInUse) throw new Error("El email se encuentra en uso");

  const collectionTiposRegistro = context.functions.execute(
    "getCollectionInstance",
    "tipos-registro"
  );

  const tipoRegistro = await collectionTiposRegistro.findOne({
    sku: recappConfig.tipo_registro_default, 
  });

  if (!tipoRegistro)
    throw new Error("No se encontró un tipo de registro para candidatos");

  if (!tipoRegistro.perfil)
    throw new Error("El tipo de registro no tiene un registro asignado");

  const dataInicial = tipoRegistro?.dataInicial
    ? {
        ...tipoRegistro?.dataInicial,
        nombres: body.nombres || "",
        apellidoPaterno: body.apellidoPaterno || "",
        apellidoMaterno: body.apellidoMaterno || "",
      }
    : {};

  return {
    email: body.email,
    password: body.password,
    tipoAuth: body.tipoAuth,
    tipoRegistro: tipoRegistro.sku || "candidato",
    perfil: tipoRegistro.perfil,
    candidato: dataInicial,
    servicioAuth: body.servicioAuth || null,
    aceptaTerminosYCondiciones: body.aceptaTerminosYCondiciones || true,
    verificado: body.verificado || false,
    fechaCreacion: moment().toDate(),
    activo: true
  };
};
