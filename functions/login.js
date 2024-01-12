exports = async function(request, response) {
  try{
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)

    const recappConfig = context.values.get("recapp_config")

    const { email = '', password = '', tipoAuth = recappConfig.tipo_auth_default, servicioAuth = null } = JSON.parse(request.body.text());

    const collectionUsuarios = context.functions.execute("getCollectionInstance", "usuario")
      
    const user = await collectionUsuarios.findOne({ email: String(email).toLowerCase().trim(), deleted: { $ne: true } });
    
    context.functions.execute("validarLogin", {
      user,
      email,
      password,
      tipoAuth,
    })

    if(tipoAuth != recappConfig.tipo_auth_default && user && servicioAuth) {
      await collectionUsuarios.updateOne({ _id: user._id }, {
        $set: {
          servicioAuth: servicioAuth
        }
      });
    }

    const token = context.functions.execute('generateToken', { keyUsuario: user._id });
    
    context.functions.execute('handlerResponse', response, { accessToken: token, user });
  } catch (err){
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
};