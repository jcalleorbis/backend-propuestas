exports = async (postulanteId, empresaId, candidatoInfo = {}) => {
    const moment = require("moment");
    if (!empresaId) throw new Error("El ID de la empresa es requerido");
    if (!postulanteId) throw new Error("El ID del postulante es requerido");

    const postulante = await context.functions.execute(
      "obtenerDocumentoPorQuery",
      {
        query: {
          _id: postulanteId,
        },
        collectionName: "postulantes",
      }
    );

    if (!postulante) throw new Error("No se encontró el postulante");

    const collectionPostulanteEmpresa = context.functions.execute(
      "getCollectionInstance",
      "postulante-empresa"
    );

    const postulanteDoc = context.functions.execute(
      "formatearPostulanteEmpresa",
      postulante,
      empresaId
    );

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
          skills: candidatoInfo?.skills || [],
          idiomas: candidatoInfo?.idiomas || [],
        }
      }
    }

    postulanteDoc.invitacionesHistorial = [nuevoItemModificacion]

    const postulanteExiste = await context.functions.execute(
      "obtenerDocumentoPorQuery",
      {
        query: {
          empresa: empresaId,
          postulante: postulanteId,
        },
        collectionName: "postulante-empresa",
      }
    );

    if(postulanteExiste) return postulanteExiste._id

    const { insertedId } = await collectionPostulanteEmpresa.insertOne(
      postulanteDoc
    );

    return insertedId;

};
