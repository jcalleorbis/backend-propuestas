
exports = async function (request, response) {
  try {
    // await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    await context.functions.execute("middlewareVerificarToken", request.headers, response)

    const { document, postulante, userId } = await validate(request)
    
    const collectionUsuarios = context.functions.execute("getCollectionInstance", "usuario")

    const { modifiedCount } = await collectionUsuarios.updateOne({ _id: userId }, {
      $set: document
    })

    if(!modifiedCount) throw new Error("Ocurrió un error modificando tus datos.\nInténtelo más tarde.")

    context.functions.execute("handlerResponse", response, {
      modificado: Boolean(modifiedCount),
      document,
      postulante
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
  const recappConfig = context.values.get("recapp_config");
  const moment = require("moment")

  const { userId, postulante, email, sincronizadoCon } = body

  if(!userId) throw new Error("El Id del usuario es requerido")

  if(!email) throw new Error("El Email es requerido")

  if(!postulante) throw new Error("Los datos obligatorios son requeridos")

  if(!postulante.skills || postulante.skills?.length == 0) throw new Error("Debes registrar un skill como mínimo")

  const postulanteValidado = context.functions.execute("validarPostulante", postulante)

  const postulantesCollection = context.functions.execute("getCollectionInstance", "postulantes")

  const queryBusqueda = {
    email: { $regex: email, $options: 'i' },
    deleted: { $ne: true }
  }

  if(sincronizadoCon?.identificador) { // si está sincronizado se ignora la búsqueda por correo
    delete queryBusqueda.email
    queryBusqueda._id = BSON.ObjectId(sincronizadoCon.identificador)
    delete queryBusqueda.email
  }

  let postulanteExiste = await context.functions.execute(
    "obtenerDocumentoPorQuery", 
    {
      query: queryBusqueda,
      collectionName: 'postulantes'
    }
  )

  const documentoValido = {
    candidato: {
      ...postulanteValidado,
      fechaActualizacion: moment().toDate()
    }
  }

  const nuevoItemModificacion = {
    ...context.functions.execute("generarCodigoVencimiento", { maxTiempoExpiracion: 5, tipoExpiracion: 'mins' }),
    valido: false,
    fechaRegistro: moment().toDate(),
    tipo: 'sincronizacion',
    versiones: {
      pre: {
        skills: [],
        idiomas: []
      },
      post: {
        skills: postulante.skills,
        idiomas: postulante.idiomas,
      }
    }
  }

  if(!postulanteExiste) { // si no existe crear nuevo postulante
    const existeMail = await context.functions.execute("validarEmailEnUso", { postulanteId: null, email })
    if(existeMail) throw new Error("El email ya se encuentra en uso")

    const estadoAutoRegistrado = await context.functions.execute('obtenerDocumentoPorQuery',
      { 
        query: {
          _id: BSON.ObjectId(recappConfig.estado_id_autoregistrado) 
        },
        collectionName: 'estados-propuesta'
      }
    )
    const { insertedId } = await postulantesCollection.insertOne({
      ...postulanteValidado,
      email: email,
      estatus: estadoAutoRegistrado || null,
      invitacionesHistorial: [nuevoItemModificacion]
    })
    postulanteExiste = await postulantesCollection.findOne({ _id: insertedId })
  } else { // caso contrario, actualiza postulante
    const existeMail = await context.functions.execute("validarEmailEnUso", { postulanteId: postulanteExiste._id, email })
    if(existeMail) throw new Error("El email ya se encuentra en uso")

    const lastUpdate = postulanteExiste.invitacionesHistorial?.[postulanteExiste.invitacionesHistorial.length - 1]


    if(lastUpdate) {
      nuevoItemModificacion.versiones.pre = lastUpdate.versiones.post
    }

    const queryUpdate = { // campos sincronizables
      $set: {
        nombres: postulanteValidado.nombres,
        apellidoPaterno: postulanteValidado.apellidoPaterno,
        apellidoMaterno: postulanteValidado.apellidoMaterno,
        email: postulanteValidado.email,
        infoPersonal: postulanteValidado.infoPersonal,
        cargo: postulanteValidado.cargo,
        pais: postulanteValidado.pais,
        ciudad: postulanteValidado.ciudad,
        telefono: postulanteValidado.telefono,
        estudios: postulanteValidado.estudios,
        cursos: postulanteValidado.cursos,
        experiencia: postulanteValidado.experiencia,
        cv: postulanteValidado.cv,
        presentacion: postulanteValidado.presentacion,
        rrss: postulanteValidado.rrss,
      },
      $push: {
        invitacionesHistorial: nuevoItemModificacion
      }
    }

    // Actualiza postulante en colección postulantes
    const { modifiedCount } = await postulantesCollection.updateOne({ _id: postulanteExiste._id }, queryUpdate)
    if(!modifiedCount) throw new Error("No se pudo actualizar los datos de postulante")

    // Actualiza postulante en colección postulante-empresa
    const colleccionPostulanteEmpresa = context.functions.execute("getCollectionInstance", "postulante-empresa") 
    await colleccionPostulanteEmpresa.updateMany({ postulante: postulanteExiste._id }, queryUpdate)
  }

  documentoValido.sincronizadoCon = { // actualiza datos de sincronizacion
    identificador: postulanteExiste._id,
    email: email,
    coleccion: 'postulantes'
  }
  //if(!sincronizadoCon) { // si no está sincronizado con un postulante
  //}

  const collectionTiposRegistro = context.functions.execute(
    "getCollectionInstance",
    "tipos-registro"
  );

  const tipoRegistroCandidato = await collectionTiposRegistro.findOne({
    sku: recappConfig.tipo_registro_candidato, 
  });

  if(!tipoRegistroCandidato) throw new Error("El tipo de registro para Candidatos no está configurado")

  documentoValido.perfil = tipoRegistroCandidato.perfil

  return {
    userId: BSON.ObjectId(userId),
    document: documentoValido,
    email,
    postulante: postulanteExiste,
  }
}