
exports = async function (request, response) {
  try {
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    await context.functions.execute("middlewareVerificarToken", request.headers, response)

    const { document, email } = await validate(request)
    const collectionUsuarios = context.functions.execute("getCollectionInstance", "usuario")

    const { matchedCount, modifiedCount } = await collectionUsuarios.updateOne({ email: email, deleted: { $ne: true } }, {
      $set: document
    })

    if (!matchedCount && !modifiedCount) throw new Error("No se pudo sincronizar los datos de postulante con tu cuenta.");

    context.functions.execute("handlerResponse", response, {
      sincronizado: true,
      modificado: Boolean(modifiedCount)
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
}

const validate = async (request) => {
  const body = JSON.parse(request.body.text())
  const moment = require("moment")
  
  if(!body.email) throw new Error("El Email es requerido")

  body.email = String(body.email).trim()

  const postulante = await context.functions.execute("buscarPostulanteSincronizacion", body.email)

  if(!postulante) throw new Error("No se encontraron datos de postulante con el Email de registro")

  return {
    email: body.email,
    document: {
      aceptaSincronizacion: true,
      fechaSincronizacion: moment().toDate(),
      sincronizadoCon: {
        identificador: postulante._id,
        email: postulante.email,
        coleccion: 'propuestas'
      },
      "candidato.email": postulante.email,
      "candidato.skills": postulante.skills,
      "candidato.idiomas": postulante.idiomas,
      "candidato.nombres": postulante.nombres,
      "candidato.apellidoPaterno": postulante.apellidoPaterno,
      "candidato.apellidoMaterno": postulante.apellidoMaterno,
      "candidato.pais": postulante.pais,
      "candidato.ciudad": postulante.ciudad,
      "candidato.telefono": postulante.telefono,
      // por ver
      // "candidato.estudios": postulante.estudios || [],
      // "candidato.cursos": postulante.cursos || [],
      // "candidato.experiencia": postulante.experiencia || [],
      // "candidato.rrss": postulante.rrss || [],
      // "candidato.cv": postulante.cv || '',
      // "candidato.presentacion": postulante.presentacion || '',
    },
  }
}