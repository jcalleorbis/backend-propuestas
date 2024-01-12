exports = async function (request, response) {
  try {
    const { query, headers, body } = request;

    await context.functions.execute(
      "middlewareVerificarOrigenClientId",
      request,
      response
    );
    // middleware validación token
    await context.functions.execute(
      "middlewareVerificarToken",
      headers,
      response
    );

    var now = require("moment");

    const { collectionName, queryDelete, hasEmpresa } = validate({ ...query });

    const collectionPostulantes = context.functions.execute(
      "getCollectionInstance",
      collectionName
    );

    let deleted = false;

    if (hasEmpresa) {
      const { deletedCount } = await collectionPostulantes.deleteOne(
        queryDelete
      );
      if (!deletedCount) {
        throw new Error("No se encontró postulante a eliminar");
      }
      deleted = Boolean(deletedCount);
    } else {
      const update = {
        $set: { deleted: true },
      };
      const options = { upsert: false };
      const { matchedCount, modifiedCount } =
        await collectionPostulantes.updateOne(queryDelete, update, options);
      // Se valida el resultado
      if (!matchedCount && !modifiedCount) {
        throw new Error("No se encontró postulante a eliminar");
      }
      deleted = Boolean(modifiedCount);
    }

    // const postulanteAct = await context.functions.execute('findPostulantePorId', data.postulanteId);
    context.functions.execute(
      "handlerResponse",
      response,
      { deleted } /* postulanteAct */
    );
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

const validate = ({ postulanteId, empresaId }) => {
  if (!postulanteId) throw new Error("Debe añadir el postulanteId");

  let queryDelete = {
    _id: BSON.ObjectId(postulanteId),
  };

  if (empresaId) {
    queryDelete = {
      postulante: BSON.ObjectId(postulanteId),
      empresa: BSON.ObjectId(empresaId),
    };
  }
  
  return {
    queryDelete,
    collectionName: empresaId ? "postulante-empresa" : "postulantes",
    hasEmpresa: Boolean(empresaId),
    postulanteId,
  };
};
