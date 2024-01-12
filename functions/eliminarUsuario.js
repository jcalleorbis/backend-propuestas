exports = async function (request, response){
  try {

    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    await context.functions.execute("middlewareVerificarToken", request.headers, response)
    
    const { usuarioId } = validate(request);

    const collectionUsuarios = context.functions.execute("getCollectionInstance", "usuario")

    await collectionUsuarios.updateOne({ _id: BSON.ObjectId(usuarioId) }, {
      $set: {
        deleted: true
      }
    })
    
    context.functions.execute('handlerResponse', response, { deleted: true });
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
};

const validate = (request) => {
  const params = { ...request.query }

  if(!params.usuarioId) throw new Error("El id del documento es requerido")

  return {
    usuarioId: params.usuarioId,
  }
}