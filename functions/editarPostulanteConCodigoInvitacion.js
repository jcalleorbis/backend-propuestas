const validateBody = (body) => {
  if (!body.codigo) throw new Error("No se proporcionó un token válido");
  if (!body.skills && !Array.isArray(body.skills) && body.skills.length == 0)
    throw new Error("No se proporcionó una lista de skills");
  if (!body.idiomas && !Array.isArray(body.idiomas))
    throw new Error("No se proporcionó una lista de idiomas");

  return {
    codigo: body.codigo,
    skills: body.skills,
    idiomas: body.idiomas,
    empresa: body.empresa || null
  };
};

const validarEstado = async (estadoId) => {
  if(!estadoId) return true
  const estadosCollection = context.services
      .get("mongodb-atlas")
      .db(context.environment.values.DB_NAME)
      .collection("estados-propuesta");
  
  const estado = await estadosCollection.findOne({ _id: BSON.ObjectId(estadoId) })
  if(!estado) return false
  return Boolean(estado?.modificable)
}

exports = async (request, response) => {
  try {
    const { query, headers, body } = request
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)

    const moment = require("moment");

    const data = validateBody({ ...JSON.parse(body.text()) });

    const collectionName = data.empresa ? 'postulante-empresa' : 'propuestas'
    const collectionPostulantes = context.functions.execute(
      "getCollectionInstance",
      collectionName
    );

    const dataFormated = await context.functions.execute('validarPropuesta', JSON.parse(body.text()), true);

    const postulante = await context.functions.execute(
      "obtenerPostulanteInvitacion",
      data.codigo
    );
    
    if (!postulante) throw new Error("No se encontraron datos del postulante.");

    if (!postulante._id)
      throw new Error("No se encontró el ID del candidato.");

    const postulanteId = postulante._id.toString()

    const estadoId = postulante?.estatus?._id?.toString() || null 

    const permiteSobrescribir = await validarEstado(estadoId)

    let querySearch = {
      _id: BSON.ObjectId(postulanteId)
    }

    if(data.empresa) {
      querySearch = {
        empresa: BSON.ObjectId(data.empresa),
        postulante: postulante?.postulante,
      }
    }

    const oldPostulante = await collectionPostulantes.findOne(querySearch);

    if(!oldPostulante) throw new Error(`El postulante no existe en nuestro sistema. ${JSON.stringify(querySearch)}`)

    const lastInvitacionEdicion = {
      // se añade la nueva modificación
      ...oldPostulante.invitacionEdicion,
      fechaRegistro: moment().toDate(),
      valido: false,
      versiones: {
        pre: {
          skills: oldPostulante.skills,
          idiomas: oldPostulante.idiomas,
        },
        post: {
          skills: data.skills,
          idiomas: data.idiomas,
        },
      },
    }
    
    const fullName = `${postulante.nombres} ${postulante.apellidoPaterno || ''} ${postulante.apellidoMaterno || ''}`;
    const mailConfig = context.values.get("mail_config");

    const sended = await context.functions.execute("enviarCorreo", {
      to: mailConfig.user_receiver, 
      subject: `Candidato ${fullName} actualizado`, 
      html: getHtmlMail({
        postulanteId,
        nombres: oldPostulante?.nombres?.toString() || '',
        apellidoPaterno: oldPostulante?.apellidoPaterno?.toString() || '',
        apellidoMaterno: oldPostulante?.apellidoMaterno?.toString() || '',
        invitacionEdicion: {
          codigo: oldPostulante?.invitacionEdicion?.codigo?.toString()
        },
        skills: data.skills,
        idiomas: data.idiomas,
      })
    })

    const objUpdate = {
      invitacionEdicion: {},
      skills: dataFormated.skills,
      idiomas: dataFormated.idiomas,
    }
    
    const objPush = {
      invitacionesHistorial: lastInvitacionEdicion,
    }

    if(!permiteSobrescribir) { // si el estado no permite sobreescribir no se toma en cuanta el cambio
      delete objUpdate.skills
      delete objUpdate.idiomas
    }

    // Se actualiza y remueve el documento donde se generó el enlace
    await collectionPostulantes.updateOne(
      querySearch,
      {
        $set: objUpdate,
        //$push: objPush
      }
    );

    // Pushear última actualización en el resto de colecciones
    const collectionPostulantesOriginal = context.functions.execute(
      "getCollectionInstance",
      "propuestas"
    );
    const collectionPostulantesEmpresa = context.functions.execute(
      "getCollectionInstance",
      "postulante-empresa"
    );
    await collectionPostulantesOriginal.updateMany({ _id: querySearch.postulante || querySearch._id }, {
      $push: objPush
    })
    await collectionPostulantesEmpresa.updateMany({ postulante: querySearch.postulante || querySearch._id }, {
      $push: objPush
    })

    context.functions.execute("handlerResponse", response, {
      postulante: fullName,
      sended,
      write: permiteSobrescribir,
      message: "¡Tus datos se enviarón correctamente!",
    });
  } catch (error) {
    context.functions.execute(
      "handlerResponse",
      response,
      null,
      400,
      false,
      error.message
    );
  }
};


const getHeaderTituto = (titulo = 'Nueva notificación de modificación de datos') => {
  return `
  <h4 style="padding: 10px 0">${titulo}</h4>
  <div style="border-bottom: 1px solid #eee; margin-bottom: 10px;"></div>
  `
}

const getGeneralData = (postulante = {}) => {
  const mailConfig = context.values.get("mail_config");
  return `
  <table style="width: 100%; max-width: 400px;">
    <tbody>
      <tr>
        <td style="padding-right: 5px">
          <span style="font-weight: 600; white-space: nowrap"
            >Candidato :</span
          >
        </td>
        <td>
          <span>${postulante?.nombres} ${postulante?.apellidoPaterno} ${postulante?.apellidoMaterno}</span>
        </td>
      </tr>
      <tr>
        <td style="padding-right: 5px">
          <span style="font-weight: 600; white-space: nowrap"
            >Enlace :</span
          >
        </td>
        <td style="padding: 8px 0">
          <a
            target="_blank"
            href="${mailConfig.base_url_invite}${postulante.postulanteId}"
            style="
              padding: 6px 12px;
              border-radius: 12px;
              background: #1477ff;
              color: #fff;
              text-transform: uppercase;
              text-decoration: none;
              font-size: 13px;
              font-weight: 600;
            "
            ><span>Ver Candidato</span></a
          >
        </td>
      </tr>
      <tr>
        <td style="padding-right: 5px">
          <span style="font-weight: 600; white-space: nowrap"
            >F. modificación :</span
          >
        </td>
        <td>
          <span>${new Date().toISOString().substring(0, 10)}</span>
        </td>
      </tr>
    </tbody>
  </table>
  <div
    style="
      border-bottom: 1px solid #eee;
      padding: 10px 0;
      margin-bottom: 10px;
    "
  ></div>
  `
}

const getChipsNivel = (max = 5, nivel = 0) => {
  let str = ""
  for(let i = 0; i< max; i++) {
    if(nivel>i) {
      str += `<div style="width: 8px; height: 8px; border-radius: 50%; background: #1477ff; display: inline-block; margin-left: 2px;"></div>`
    } else {
      str += `<div style="width: 8px; height: 8px; border-radius: 50%; background: #ccc; display: inline-block; margin-left: 2px;"></div>`
    }
  }
  return str
}

const ordenarSkills = (skills = []) => {
  return skills.sort((a, b) => ((parseInt(b.nivel) || 0) - (parseInt(a.nivel) || 0)));
}

const getSkillsTable = (skills = []) => {
  const skillsSorted = ordenarSkills(skills)
  return `
  <h4
    style="
      font-weight: 600;
      font-size: 15px;
      font-weight: 600;
      color: #1477ff;
      margin-bottom: 0px;
    "
  >
    Skills
  </h4>
  <table style="width: 100%; padding: 10px 0;">
    <tbody>
      ${skillsSorted.map(skill => `
        <tr>
          <td style="padding: 5px 0;">
            <span style="font-weight: 600; white-space: nowrap; font-size: 14px;"
              >${skill.conocimiento?.nombre}</span
            >
          </td>
          <td style="text-align: right;">
            <span style="padding-right: 5px; font-size: 13px; font-weight: 500;">(${skill.nivel || 0}/${5})</span>
            ${getChipsNivel(5, skill.nivel)}
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div
    style="
      border-bottom: 1px solid #eee;
      padding: 10px 0;
      margin-bottom: 10px;
    "
  ></div>
  `
}

const getIdiomasTable = (idiomas = []) => {
  return `
  <h4
    style="
      font-weight: 600;
      font-size: 15px;
      font-weight: 600;
      color: #1477ff;
      margin-bottom: 0px;
    "
  >
    Idiomas
  </h4>
  <table style="width: 100%; padding: 10px 0;">
    <thead>
      <th></th>
      <th style="font-size: 14px; text-align: right;">Niv. Oral</th>
      <th style="font-size: 14px; text-align: right;">Niv. Escrito</th>
    </thead>
    <tbody>
      ${idiomas.map(idioma => `
        <tr>
          <td style="padding: 5px 0;">
            <span style="font-weight: 600; white-space: nowrap; font-size: 14px;"
              >${idioma?.idioma?.idioma || ''}</span
            >
          </td>
          <td style="text-align: right;">
            <span style="padding-right: 5px; font-size: 13px; font-weight: 500;">(${idioma?.oral || 0}/${3})</span>
            ${getChipsNivel(3, idioma.oral)}
          </td>
          <td style="text-align: right;">
            <span style="padding-right: 5px; font-size: 13px; font-weight: 500;">(${idioma?.escrito || 0}/${3})</span>
            ${getChipsNivel(3, idioma.escrito)}
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div
    style="
      border-bottom: 1px solid #eee;
      padding: 10px 0;
      margin-bottom: 10px;
    "
  ></div>
  `
}

const getPostulanteEditInfo = (postulante, titulo = '', hideGeneralInfo = false) => {
  return `
    ${getHeaderTituto(titulo)}
    ${!hideGeneralInfo ? getGeneralData(postulante) : ''}
    ${getSkillsTable(postulante.skills)}
    ${getIdiomasTable(postulante.idiomas)}
  `
}

const getHtmlMail = (postulanteEditado) => {
  return `
  <div
    style="
      background-color: #eee;
      padding: 20px;
      width: 100%;
      height: 100%;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      box-sizing: border-box;
    "
  >
    <div
      style="
        margin: auto;
        background: #fff;
        padding: 15px 20px;
        box-sizing: border-box;
        max-width: 600px;
      "
    >
      ${getPostulanteEditInfo(postulanteEditado, 'Nueva notificación de modificación de datos')}
    </div>
  </div>
  `
}