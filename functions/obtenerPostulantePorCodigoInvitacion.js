const validateQueries = ({ codigo }) => {
  if (!codigo) throw new Error("El token es inválido");
  return { codigo };
};

exports = async (request, response) => {
  try {
    const { query, headers, body } = request
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)

    const data = validateQueries({ ...query })
    const postulante = await context.functions.execute("obtenerPostulanteInvitacion", data.codigo);

    if(postulante.invitacionesHistorial && postulante.invitacionesHistorial.length > 0) {
      const length = postulante.invitacionesHistorial.length
      const lastModified = postulante.invitacionesHistorial?.[length-1]?.versiones?.post // obtiene el último cambio del candidato
      postulante.skills = lastModified.skills || []
      postulante.idiomas = lastModified.idiomas || []
    }

    postulante.codigoUpload = postulante._id
    delete postulante.invitacionesHistorial
    delete postulante.estatus
    delete postulante._id

    context.functions.execute('handlerResponse', response, postulante);
  } catch (error) {
    context.functions.execute('handlerResponse', response, null, 400, false, error.message);
  }
}