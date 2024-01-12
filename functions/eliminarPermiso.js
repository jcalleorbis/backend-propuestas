exports = async function (request, response){
  try {

    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    await context.functions.execute("middlewareVerificarToken", request.headers, response)
    
    const { permisoId } = validate(request);
    
    const collectionPermisos = context.functions.execute("getCollectionInstance", "permisos")
    const collectionPerfiles = context.functions.execute("getCollectionInstance", "perfiles")

    const permsInUse = await collectionPerfiles.find({ 
      "accesos": { $elemMatch: { _id: BSON.ObjectId(permisoId) } } 
    }).toArray()
    
    if(permsInUse?.length > 0) {
      throw new Error({ 
        errorMessage: 'El permiso se encuentra actualmente en uso.<br/>Si desea eliminar el permiso actual dirijase a la pestaña de Perfiles y remueva el permiso de los siguientes perfiles:', 
        errorData: permsInUse 
      });
    }

    const { acknowledged, deletedCount } = await collectionPermisos.deleteOne({ _id: BSON.ObjectId(permisoId) })
    
    if (!acknowledged && deletedCount == 0) throw new Error("No se pudo eliminar el permiso seleccionado");
    
    context.functions.execute('handlerResponse', response, { deleted: true, permsInUse });
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
};

const validate = (request) => {
  const params = { ...request.query }

  if(!params.permisoId) throw new Error("El id del documento es requerido")

  return {
    permisoId: params.permisoId,
  }
}