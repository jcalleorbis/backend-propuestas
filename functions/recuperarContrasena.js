exports = async function (request, response) {
  try {
    await context.functions.execute(
      "middlewareVerificarOrigenClientId",
      request,
      response
    );

    const collectionUsuarios = context.functions.execute(
      "getCollectionInstance",
      "usuario"
    );

    const { email, usuario, bodyRestablecimiento } = await validate(request, collectionUsuarios);

    const { matchedCount, modifiedCount } = await collectionUsuarios.updateOne({ _id: usuario._id }, {
      $set: {
        tokenRestablecimiento: bodyRestablecimiento
      }
    })

    if (!matchedCount && !modifiedCount) throw new Error("No se pudo generar su token de restablecimiento");

    const mailConfig = context.values.get("mail_config")
    const sended = await context.functions.execute("enviarCorreo", {
      to: email, 
      subject: `Restablecimiento de contraseña: ${email}`,
      html: getEmailRecuperacion({
        titulo: `Datos de restablecimiento:`,
        email,
        url: `${mailConfig.base_url_recovery}?token=${bodyRestablecimiento.codigo}`,
      }),
      account: 'noreply_account'
    })

    context.functions.execute('handlerResponse', response, {
      envioCorreo: sended,
      bodyRestablecimiento,
      email,
      url: `${mailConfig.base_url_recovery}?token=${bodyRestablecimiento.codigo}`,
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
  const moment = require("moment");

  
  if (!body.email) throw new Error("El Email es requerido");
  
  body.email = String(body.email).trim()

  const usuario = await collection.findOne({
    email: { $regex: body.email, $options: "i" },
    deleted: { $ne: true }, // que no esté eliminado
    activo: { $ne: false }, // que se encuentre activo
  });

  if (!usuario)
    throw new Error("El usuario no existe o no se encuentra disponible.");

  if (String(usuario.email).toLowerCase() !== String(body.email).toLowerCase())
    throw new Error("El usuario no existe o no se encuentra disponible.");

  if(usuario.tipoAuth != 'recapp') throw new Error("Su tipo de registro no permite realizar una recuperación de contraseña."); // por ver

  //if(!Boolean(usuario.cuentaVerificada)) throw new Error("Su cuenta no ha sido verificada."); // por ver

  const totalHistorial = usuario?.historialTokensRecuperacion?.length || 0;
  const ultimoToken =
    usuario.tokenRestablecimiento ||
    usuario?.historialTokensRecuperacion?.[totalHistorial - 1] ||
    null;
  const minHorasGeneracion = 24;
  const tipoExpiracion = 'hours'
  const fechaActual = moment();
  const fechaGeneracionUltimoToken =
    ultimoToken?.codigo &&
    (await context.functions.execute("decodificarToken", ultimoToken.codigo))?.fechaGeneracion;

  if (
    ultimoToken && fechaGeneracionUltimoToken &&
    fechaActual.diff(moment(ultimoToken.fechaGeneracion), tipoExpiracion) <=
      minHorasGeneracion
  )
    throw new Error({
      errorMessage: `Estimado usuario.\nSolo puede generar un código de recuperación cada ${minHorasGeneracion} horas.`,
      errorData: {
        email: usuario.email,
        fechaVencimientoUltimoToken: ultimoToken.fechaExpiracion,
        ultimaFechaGeneracion: ultimoToken.fechaGeneracion,
        proximaFechaGeneracion: moment(ultimoToken.fechaGeneracion).add(
          minHorasGeneracion,
          tipoExpiracion
        ),
      },
    });

  const bodyRestablecimiento = context.functions.execute(
    "generarCodigoVencimiento",
    {
      maxTiempoExpiracion: minHorasGeneracion,
      tipoExpiracion: tipoExpiracion,
      requireFirma: true,
    }
  );

  return {
    email: body.email,
    usuario: usuario,
    bodyRestablecimiento,
  };
};


const getEmailRecuperacion = ({ titulo, email, url }) => {
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
        
        <table style="width: 100%; max-width: 400px;">
          <tbody>
            <tr>
              <td style="padding-right: 5px">
                <span style="font-weight: 600; white-space: nowrap"
                  >Email :</span
                >
              </td>
              <td>
                <span>${email}</span>
              </td>
            </tr>
            <tr>
              <td style="padding-right: 5px">
                <span style="font-weight: 600; white-space: nowrap"
                  >Enlace :</span
                >
              </td>
              <td style="padding: 8px 0">
                <a
                  target="_blank"
                  href="${url}"
                  style="
                    padding: 6px 12px;
                    border-radius: 12px;
                    background: #1477ff;
                    color: #fff;
                    text-transform: uppercase;
                    text-decoration: none;
                    font-size: 13px;
                    font-weight: 600;
                  "
                  ><span>Modificar Contraseña</span></a
                >
              </td>
            </tr>
            <tr>
              <td style="padding-right: 5px">
                <span style="font-weight: 600; white-space: nowrap"
                  >Expira en :</span
                >
              </td>
              <td>
                <span>${ '24 horas' }</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
}