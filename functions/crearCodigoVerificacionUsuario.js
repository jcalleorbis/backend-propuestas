exports = async function (request, response) {
  try {
    await context.functions.execute(
      "middlewareVerificarOrigenClientId",
      request,
      response
    );

    const recappConfig = context.values.get("recapp_config");
    const collectionUsuarios = context.functions.execute(
      "getCollectionInstance",
      "usuario"
    );

    const codigoVerificacion = context.functions.execute(
      "generarCodigoAleatorio",
      recappConfig.code_verification_length
    );
    const tokenVerificacion = context.functions.execute(
      "generarCodigoVencimiento",
      {
        codigoDefault: codigoVerificacion,
        maxTiempoExpiracion: recappConfig.exp_token_verificacion,
        tipoExpiracion: "hours",
        requireFirma: false,
      }
    );
    const expiresLabel = `${recappConfig.exp_token_verificacion} horas`;

    const { email, usuarioId } = await validate(request, collectionUsuarios);

    const { matchedCount, modifiedCount } = await collectionUsuarios.updateOne(
      { _id: usuarioId },
      {
        $set: {
          tokenVerificacion,
        },
      }
    );

    if (!matchedCount && !modifiedCount)
      throw new Error(
        "No se pudo generar un código de verificación para su cuenta"
      );

    const sended = await context.functions.execute("enviarCorreo", {
      to: email,
      subject: `Verificación de cuenta ${email}`,
      html: getEmailVerificacion({
        codigo: codigoVerificacion,
        expiresLabel,
        email,
      }),
      account: 'noreply_account'
    });

    context.functions.execute("handlerResponse", response, {
      envioCorreo: sended,
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

  if (!body.email) throw new Error("El email es requerido");

  body.email = String(body.email).toLowerCase()

  const usuario = await collection.findOne({
    email: body.email,
    deleted: { $ne: true },
    activo: { $ne: false },
  });

  if (!usuario)
    throw new Error(
      "El email no existe o se encuentra temporalmente deshabilitado"
    );

  if (usuario.verificado)
    throw new Error("Estimado usuario.\nSu cuenta ya se encuentra verificada.");

  return {
    email: body.email,
    usuarioId: usuario._id,
  };
};

const getEmailVerificacion = ({
  titulo = "Verificación de cuenta",
  codigo,
  email,
  expiresLabel,
}) => {
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
          <br/>Hemos generado un Código de verificación para su cuenta <strong>${email}</strong>
          <br/>Puede utilizar el siguiente código antes de las próximas ${expiresLabel}.
         </span>
        </p>
        <table style="width: 100%; max-width: 400px;">
          <tbody>
            <tr>
              <td>
                <span style="font-size: 20px; font-weight: bold;">${codigo}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
};
