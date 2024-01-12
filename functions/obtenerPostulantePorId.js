exports = async function(request, response){
  try {
    const { query, headers, body } = request
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)

    // middleware validación token
    await context.functions.execute("middlewareVerificarToken", headers, response)

    const data = validate({...query});

    const postulante = await context.functions.execute('findPostulantePorId', data.postulanteId, data.creadorId);
    if(postulante.deleted) {
      throw new Error("eliminado");
    }
    context.functions.execute('handlerResponse', response, postulante);
  } catch (err) {
    if(err.message === "eliminado") {
      context.functions.execute('handlerResponse', response, null, 404, false, null);
    } else {
      context.functions.execute('handlerResponse', response, null, 400, false, err.message);
    }
  }
};

const validate = ({ postulanteId, creadorId }) => {
  if (!postulanteId) throw new Error("Debe añadir el postulanteId");
  return { postulanteId, creadorId };
};