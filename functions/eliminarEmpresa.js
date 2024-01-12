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

    const { empresaId } = validate(request);

    const collectionEmpresas = context.functions.execute(
      "getCollectionInstance",
      "empresas"
    );
    const collectionUsuarios = context.functions.execute(
      "getCollectionInstance",
      "usuario"
    );
    const collectionOfertas = context.functions.execute(
      "getCollectionInstance",
      "ofertas-empleo"
    );

    const { modifiedCount } = await collectionEmpresas.updateOne(
      { _id: BSON.ObjectId(empresaId) },
      {
        $set: {
          deleted: true,
        },
      }
    );

    const ofertasEmpresa = await collectionOfertas
      .find({ empresa: BSON.ObjectId(empresaId) })
      .toArray();
    const usuarios = await collectionUsuarios
      .find({ empresa: BSON.ObjectId(empresaId) })
      .toArray();

    if (!modifiedCount)
      throw new Error("No se pudo eliminar la Empresa seleccionada");

    // Se eliminan las ofertas de la empresa
    await collectionOfertas.updateMany(
      { empresa: BSON.ObjectId(empresaId) },
      {
        $set: {
          deleted: true,
        },
      }
    );
    // Se elimina la relación de los uusarios con la empresa
    await collectionUsuarios.updateMany(
      {
        empresa: BSON.ObjectId(empresaId),
      },
      {
        $unset: {
          empresa: "",
        },
      }
    );

    context.functions.execute("handlerResponse", response, {
      deleted: Boolean(modifiedCount),
      usuarios,
      ofertasEmpresa,
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

  if (!params.empresaId) throw new Error("El id de la empresa es requerido");

  return {
    empresaId: params.empresaId,
  };
};
