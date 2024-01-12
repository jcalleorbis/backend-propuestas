exports = (postulante, empresaId) => { // se requiere pasar en Object id
  const now = require("moment");
  const postulanteClone = JSON.parse(JSON.stringify(postulante));

  postulanteClone.empresa = empresaId
  postulanteClone.postulante = postulante._id

  // eliminar propiedades que no se deben guardar en las otras empresas
  delete postulanteClone?.skills;
  delete postulanteClone?.idiomas;
  delete postulanteClone?._id;
  delete postulanteClone?.historialEstatus;
  delete postulanteClone?.historialCambios;
  delete postulanteClone?.invitacionEdicion;
  delete postulanteClone?.invitacionesHistorial;
  delete postulanteClone?.codigo;
  delete postulanteClone?.preferenciaMoneda?.comentarios;
  delete postulanteClone?.creadorId;
  delete postulanteClone?.estatus;
  delete postulanteClone?.fechaRegistro;

  postulanteClone.fechaRegistro = now().toDate();
  postulanteClone.fechaModificacion = now().toDate();

  return postulanteClone;
};
