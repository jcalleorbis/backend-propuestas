exports = async function (request, response) {
  try {
    await context.functions.execute(
      "middlewareVerificarOrigenClientId",
      request,
      response
    );
    await context.functions.execute(
      "middlewareVerificarToken",
      request.headers,
      response
    );

    const { usuarioId, ofertaId } = validate(request)

    const collectionKanban = context.functions.execute("getCollectionInstance", "kanban-usuarios")

    const kanbanUsuario = await collectionKanban.findOne({ usuario: usuarioId, oferta: ofertaId })

    context.functions.execute("handlerResponse", response, kanbanUsuario);
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

const validate = (request) => {
  const jwtConfig = context.values.get("jwt_config")
  const sessionUser = request.headers?.[jwtConfig.headerUser]
  const { ofertaId } = request.query

  if(!ofertaId) throw new Error("El ID de la oferta es requerido")

  return {
    usuarioId: sessionUser._id,
    ofertaId: BSON.ObjectId(ofertaId)
  };
};

