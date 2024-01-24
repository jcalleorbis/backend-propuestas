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
  
      const { clienteId } = validate(request);
  
      const collectionClientes = context.functions.execute(
        "getCollectionInstance",
        "clientes"
      );
  
      const { modifiedCount } = await collectionClientes.updateOne(
        { _id: BSON.ObjectId(clienteId) },
        {
          $set: {
            deleted: true,
          },
        }
      );
  
      if (!modifiedCount)
        throw new Error("No se pudo eliminar el Cliente seleccionado");
  
      context.functions.execute("handlerResponse", response, {
        deleted: Boolean(modifiedCount)
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
    const params = { ...request.query };
  
    if (!params.clienteId) throw new Error("El id del cliente es requerido");
  
    return {
        clienteId: params.clienteId,
    };
  };
  