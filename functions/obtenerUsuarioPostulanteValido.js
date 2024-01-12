exports = async function (request, response) {
  try {
    // await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    await context.functions.execute("middlewareVerificarToken", request.headers, response)

    const payload = validate(request);
    
    const usuario = await context.functions.execute(
      "obtenerDocumentoPorQuery",
      {
        query: {
          email: payload.email,
          deleted: { $ne: true },
          activo: { $ne: false },
          aceptaSincronizacion: { $ne: false },
          sincronizado: { $ne: true },
          sincronizadoCon: null
        },
        collectionName: 'usuario'
      }
    );
      
    if(!usuario) {
      return context.functions.execute("handlerResponse", response, {
        message: 'El usuario no existe o ya sincronizó sus datos',
        permitirSincronizacion: false,
        email: payload.email,
      });
    }

    const postulante = await context.functions.execute("buscarPostulanteSincronizacion", payload.email)

    context.functions.execute("handlerResponse", response, {
      existePostulante: Boolean(postulante),
      pendienteSincronizacion: Boolean(usuario),
      email: payload.email,
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
};

const validate = (request) => {
  const body = { ...request.query };

  if (!body.email) throw new Error("El Email es requerido");

  return {
    email: body.email,
  };
};
