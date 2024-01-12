exports = async function (email) {
  try {

    if (!email) throw new Error("El Email es requerido");

    const emailRegex = { $regex: email, $options: 'i' };
    const postulante = await context.functions.execute(
      "obtenerDocumentoPorQuery",
      {
        query: {
          email: emailRegex,
          invitacionesHistorial: {
            $elemMatch: { valido: false, fechaRegistro: { $ne: null } },
          },
          deleted: { $ne: true }
        },
        output: {
          historialCambios: 0,
          fechaModificacion: 0,
          estatus: 0,
          fechaRegistro: 0
        },
        collectionName: 'propuestas'
      }
    );
      
    if(postulante) {
      const lastUpdatedIdx = postulante.invitacionesHistorial?.length
      const lastUpdate = postulante.invitacionesHistorial?.[lastUpdatedIdx - 1]?.versiones?.post
      const { skills = [], idiomas = [] } = lastUpdate
      postulante.skills = skills
      postulante.idiomas = idiomas

      delete postulante.invitacionesHistorial
    }

    return postulante
  } catch (err) {
    return null
  }
};

