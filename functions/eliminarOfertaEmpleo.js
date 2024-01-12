exports = async function (request, response){
  try {

    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    await context.functions.execute("middlewareVerificarToken", request.headers, response)
    
    const { ofertaId } = validate(request);
    
    const collectionOfertasEmpleo = context.functions.execute("getCollectionInstance", "ofertas-empleo")
    const collectionPostulaciones = context.functions.execute("getCollectionInstance", "postulaciones")

    const postulantesOferta = await collectionPostulaciones.count({ oferta: BSON.ObjectId(ofertaId), deleted: { $ne: true } })
    const ofertaActiva = await collectionOfertasEmpleo.findOne({ _id: BSON.ObjectId(ofertaId), finalizado: { $ne: true } })

    if(postulantesOferta > 0 && ofertaActiva)
      throw new Error(`No puedes eliminar una oferta activa que tiene ${postulantesOferta} postulante(s).\nFinaliza la oferta para proceder con la eliminación.`)

    const { modifiedCount } = await collectionOfertasEmpleo.updateOne({ _id: BSON.ObjectId(ofertaId) }, {
      $set: {
        deleted: true
      }
    })
    
    if (!modifiedCount) throw new Error("No se pudo eliminar la Oferta de Empleo seleccionada");
    
    context.functions.execute('handlerResponse', response, { deleted: Boolean(modifiedCount) });
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
};

const validate = (request) => {
  const params = { ...request.query }

  if(!params.ofertaId) throw new Error("El id del documento es requerido")

  return {
    ofertaId: params.ofertaId,
  }
}