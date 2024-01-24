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
  
      const { query } = request;
  
      if (!query.clienteId) throw new Error("El id es requerido");
  
      const collectionClientes = context.functions.execute(
        "getCollectionInstance",
        "clientes"
      );
  
      const cliente = await collectionClientes.findOne({
        _id: BSON.ObjectId(query.clienteId),
        deleted: { $ne: true },
      });
  
      context.functions.execute("handlerResponse", response, cliente);
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
  