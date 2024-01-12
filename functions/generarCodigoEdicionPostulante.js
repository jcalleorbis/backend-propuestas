const validate = ({ postulanteId, empresaId }) => {
  if (!postulanteId) throw new Error("Debe añadir el postulanteId");

  let querySearch = {
    _id: BSON.ObjectId(postulanteId),
  };

  if (empresaId) {
    querySearch = {
      postulante: BSON.ObjectId(postulanteId),
      empresa: BSON.ObjectId(empresaId),
    };
  }

  return { 
    querySearch,
    collectionName: empresaId ? "postulante-empresa" : "postulantes",
  };
};

exports = async (request, response) => {
  try {
    const { query, headers, body } = request
    // middlewares validación token y client id
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    await context.functions.execute("middlewareVerificarToken", headers, response)

    const { collectionName, querySearch } = validate({...JSON.parse(body.text())});

    const invitacionObj = "invitacionEdicion" // nombre de la propiedad para guardar los códigos de invitaciones
    const maxDiasExpiracion = 3

    const collectionPostulantes = context.functions.execute(
      "getCollectionInstance",
      collectionName
    );

    const postulante = await collectionPostulantes.findOne(querySearch)

    if(!postulante) throw new Error("El postulante no existe o no se proporcionó un ID válido");

    const now = require("moment");
    const uuid = require("uuid")


    const objInvitacion = {
      ...context.functions.execute("generarCodigoVencimiento", { maxTiempoExpiracion: maxDiasExpiracion, tipoExpiracion: 'days', requireFirma: false }),
      valido: true,
      versiones: {
        pre: {},
        post: {}
      }
    }

    await collectionPostulantes.updateOne(querySearch, {
      $set: {
        [invitacionObj]: objInvitacion
      }
    })

    context.functions.execute('handlerResponse', response, objInvitacion);

  } catch (error) {
    context.functions.execute('handlerResponse', response, null, 400, false, error.message);
  }
  
};
