exports = async function (request, response) {
  try {
    await context.functions.execute(
      "middlewareVerificarOrigenClientId",
      request,
      response
    );
    await context.functions.execute(
      "middlewareVerificarToken",
      request.headers,
      response
    );

    const { payload, usuarioId, randomPassword, usuarioExiste } = await validate(request);

    const collectionEmpresas = context.functions.execute(
      "getCollectionInstance",
      "empresas"
    );
    const collectionUsuarios = context.functions.execute(
      "getCollectionInstance",
      "usuario"
    );

    const { insertedId } = await collectionEmpresas.insertOne(payload);

    if (!insertedId) {
      await collectionUsuarios.deleteOne({ _id: usuarioId });
      throw new Error("No se pudo registrar la empresa");
    }

    await collectionUsuarios.updateOne(
      { _id: usuarioId },
      {
        $set: {
          empresa: insertedId,
        },
      }
    );

    if(!usuarioExiste) {
      await context.functions.execute("enviarCorreo", {
        to: payload.email,
        subject: `Registro de cuenta Empresa ${payload.email}`,
        html: getEmailRegistroEmpresa({
          titulo: 'Registro de Empresa',
          password: randomPassword,
          email: payload.email,
        }),
        account: 'noreply_account'
      });
    }

    const empresa = await collectionEmpresas.findOne({ _id: insertedId });

    context.functions.execute("handlerResponse", response, {...empresa, usuarioExiste});
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

const getEmailRegistroEmpresa = ({ titulo, email, password }) => {
  return `
    <div
      style="
        background-color: #eee;
        padding: 20px;
        width: 100%;
        height: 100%;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        box-sizing: border-box;
      "
    >
      <div
        style="
          margin: auto;
          background: #fff;
          padding: 15px 20px;
          box-sizing: border-box;
          max-width: 600px;
        "
      >
        <h4 style="padding: 10px 0">${titulo}</h4>
        <div style="border-bottom: 1px solid #eee; margin-bottom: 10px;"></div>
        
        <p style="padding: 10px 0; font-size: 14px;">
          <span>Estimado usuario,
          <br/>Su cuenta de Empresa se ha generado correctamente, a continuación le dejamos la contraseña inicial de su cuenta <strong>${email}</strong>
          </span>
        </p>
        <table style="width: 100%; max-width: 400px;">
          <tbody>
            <tr>
              <td>
                <span style="font-size: 20px; font-weight: bold;">${password}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
};

const validate = async (request) => {
  const body = JSON.parse(request.body.text());
  const moment = require("moment");
  const passwordHash = require("password-hash");
  const jwtConfig = context.values.get("jwt_config");
  const recappConfig = context.values.get("recapp_config");

  if (!body.nombre) throw new Error("El nombre es requerido");
  if (!body.pais) throw new Error("El País es requerido");
  if (!body.email) throw new Error("El email del administrador es requerido");

  body.email = String(body.email).toLowerCase();

  const existeInEmpresas = await context.functions.execute(
    "obtenerDocumentoPorQuery",
    {
      query: {
        email: body.email,
        deleted: { $ne: true },
      },
      collectionName: "empresas",
    }
  );

  if (existeInEmpresas)
    throw new Error(
      `Ya existe una empresa registrada con este mail ${body.email}`
    );

  const collectionUsuarios = context.functions.execute(
    "getCollectionInstance",
    "usuario"
  );

  const tipoRegistro = await context.functions.execute(
    "obtenerDocumentoPorQuery",
    {
      query: {
        sku: recappConfig.tipo_registro_empresa,
      },
      collectionName: "tipos-registro",
    }
  );

  if (!tipoRegistro || !tipoRegistro?.perfil)
    throw new Error("No se encontró un tipo de registro para empresas");

  const mailInUse = await context.functions.execute("validarPropiedadEnUso", {
    collection: collectionUsuarios,
    value: body.email,
    key: "email",
    extraParams: {
      deleted: { $ne: true },
    },
  });
  
  const randomPassword = context.functions.execute("crearRandomPassword", 10);
  const passwordHashed = await passwordHash.generate(randomPassword);

  const sessionUser = request.headers?.[jwtConfig.headerUser];

  const nuevaAccount = {
    email: body.email,
    perfil: tipoRegistro?.perfil,
    password: passwordHashed,
    tipoAuth: recappConfig.tipo_auth_default,
    activo: true,
    fechaCreacion: moment().toDate(),
    creadoPor: sessionUser?._id,
  };

  let insertedId, usuarioExiste = false


  if(!mailInUse) { // registra
    const saved = await collectionUsuarios.insertOne(nuevaAccount);
    if (!saved.insertedId)
      throw new Error(
        "Ocurrió un error intentando crear el usuario para su cuenta, vuelva a intentarlo nuevamente."
      );
    insertedId = saved.insertedId
  } else { // actualiza perfil de usuario
    const currentUser = await collectionUsuarios.findOne({ email: body.email, deleted: { $ne: true }, })
    if(!currentUser) 
      throw new Error("El email está mal escrito o el usuario no existe");
    await collectionUsuarios.updateOne({ _id: currentUser._id }, {
      $set: {
        perfil: tipoRegistro?.perfil,
        fechaActualizacion: moment().toDate(),
      }
    })
    insertedId = currentUser._id
    usuarioExiste = true
  }
  // if (mailInUse) throw new Error(`El email ${body.email} se encuentra en uso`);

  const nuevoSku = await context.functions.execute("crearSkuEmpresa", {
    nombreEmpresa: body.nombre,
    empresaId: null,
  });

  return {
    usuarioId: insertedId,
    usuarioExiste,
    randomPassword,
    payload: {
      nombre: body.nombre,
      sku: nuevoSku,
      pais: body.pais,
      email: body.email,
      empleados: body.empleados || "",
      frase: body.frase || '',
      descripcion: body.descripcion || "",
      descripcionCorta: body.descripcionCorta || "",
      beneficios: body.beneficios || "",
      website: body.website || "",
      redes: body.redes || {},
      creadoPor: sessionUser?._id,
      fechaCreacion: moment().toDate(),
      administrador: insertedId,
    },
  };
};
