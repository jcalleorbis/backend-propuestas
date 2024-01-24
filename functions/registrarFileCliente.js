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
  
      const { clienteId, buffer, format } = validate(request);
  
      const collectionClientes = context.functions.execute(
        "getCollectionInstance",
        "clientes"
      );
  
      const { modifiedCount } = await collectionClientes.updateOne(
        { _id: BSON.ObjectId(clienteId) },
        {
          $set: {
            logo: buffer
          },
        }
      );
  
      if (!modifiedCount)
        throw new Error("No se pudo eliminar el Cliente seleccionado");

        const clientDocument = await collectionClientes.findOne({ _id: clienteId })
  
      context.functions.execute("handlerResponse", response, {
        data: clientDocument
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
    const body = request.body.text();
    const base64 = body.split(',');
  
    if (!params.clienteId) throw new Error("El id del cliente es requerido");
    if (!body) throw new Error("El buffer es requerido");
  
    return {
        clienteId: params.clienteId,
        buffer: body
    };
  };
  