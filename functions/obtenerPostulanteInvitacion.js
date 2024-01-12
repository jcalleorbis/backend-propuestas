const customMensajeHTML = ({ title = "", subtitle = "", body = "", contactList = [] }) => {
  return {
    title,
    subtitle,
    description: body,
    contactList, 
  };
};

const getErrorUrlUtilizada = () => {
  return customMensajeHTML({
    subtitle: "Esta URL ya ha sido utilizada.",
    body: "Estimado usuario, usted ya ha completado la información solicitada.\nSi requiere volver a solicitar una nueva comuniquese con alguno de los medios de contacto que se muestran a continuación.",
    contactList: [ 
      { name: 'Correo', value: 'reclutamiento@orbisdata.pe' },
      { name: 'Whatsapp', value: '+51 1644 9117' },
    ]
  })
}

const getErrorExpirado = () => {
  return customMensajeHTML({
    subtitle: "La URL es inválida o ha caducado.",
    body: "Estimado usuario, no cuentas con permiso para acceder a esta URL.\nSi requiere volver a solicitar una nueva URL comuníquese con alguno de los medios de contacto que se muestran a continuación.",
    contactList: [ 
      { name: 'Correo', value: 'reclutamiento@orbisdata.pe' },
      { name: 'Whatsapp', value: '+51 1644 9117' },
    ]
  })
}

exports = async (codigoInvitacion) => {
  
  const collectionPostulantes = context.functions.execute(
    "getCollectionInstance",
    "propuestas"
  );
  const collectionPostulantesEmpresa = context.functions.execute(
    "getCollectionInstance",
    "postulante-empresa"
  );

  const moment = require("moment");

  const queryFind = {
    "invitacionEdicion.codigo": codigoInvitacion,
    "invitacionEdicion.valido": true,
    deleted: {
      $ne: true
    }
  }

  const resultOptions = {
    _id: 1,
    nombres: 1,
    apellidoPaterno: 1,
    apellidoMaterno: 1,
    pais: 1,
    skills: 1,
    idiomas: 1,
    ciudad: 1,
    invitacionEdicion: 1,
    invitacionesHistorial: 1,
    estatus: 1
  }

  let postulante = await collectionPostulantes.findOne(queryFind, resultOptions);

  if(!postulante) { // un intento en colección postulante-empresa
    postulante = await collectionPostulantesEmpresa.findOne(queryFind, { ...resultOptions, empresa: 1, postulante: 1 });
  }

  if (!postulante) {
    const postulanteUrlEmpleada = await collectionPostulantes.findOne({
      "invitacionesHistorial.codigo": codigoInvitacion,
      "invitacionesHistorial.valido": false,
    })
    if(postulanteUrlEmpleada) throw new Error(getErrorUrlUtilizada());
    throw new Error(getErrorExpirado());
  }

  if (
    moment(postulante.invitacionEdicion?.fechaExpiracion).toDate() <
    moment().toDate()
  )
    throw new Error(getErrorExpirado());

  return postulante;
};
