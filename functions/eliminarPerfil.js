exports = async function (request, response){
  try {

    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    await context.functions.execute("middlewareVerificarToken", request.headers, response)
    
    const { perfilId } = validate(request);

    const collectionPerfiles = context.functions.execute("getCollectionInstance", "perfiles")
    const collectionUsuarios = context.functions.execute("getCollectionInstance", "usuario")

    const { acknowledged, deletedCount } = await collectionPerfiles.deleteOne({ _id: BSON.ObjectId(perfilId) })
    
    if (!acknowledged && deletedCount == 0) throw new Error("No se pudo eliminar el perfil seleccionado");

    await collectionUsuarios.updateMany({ perfil: BSON.ObjectId(perfilId) }, {
      $set: {
        perfil: null
      }
    })
    
    context.functions.execute('handlerResponse', response, { deleted: true });
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
};

const validate = (request) => {
  const params = { ...request.query }

  if(!params.perfilId) throw new Error("El id del documento es requerido")

  return {
    perfilId: params.perfilId,
  }
}