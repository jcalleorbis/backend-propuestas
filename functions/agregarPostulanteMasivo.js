exports = async function(request, response/*,body*/){

  const { query, headers, body } = request
    
  await context.functions.execute("middlewareVerificarOrigenClientId", request, response)

  const XLSX = require('xlsx');
  const postulantes = [];
  try {
    if (!body.text()) throw new Error ('No se esta enviando el body en el request');
    //if (!body) throw new Error ('No se esta enviando el body en el request');
    const data = body.text();
    //const data = body;
    const bufferExcel = Buffer.from(data,'base64');
    const workbook = XLSX.read(bufferExcel, {
      type: 'buffer',
    });
    var worksheet = workbook.Sheets[workbook.SheetNames[0]];
    var dataJSON = XLSX.utils.sheet_to_json(worksheet);
    const collectionPostulantes = context.services
      .get('mongodb-atlas')
      .db(context.environment.values.DB_NAME)
      .collection('propuestas');
    for (let i = 0; i < dataJSON.length; i++) {
        const element = dataJSON[i];
        let postulanteExiste = await context.functions.execute('obtenerPostulantePorEmail', `${element.email}`);
        if(postulanteExiste && !postulanteExiste.deleted) {
          postulantes.push({
            postulante: postulanteExiste,
            warning: `Ya existia un postulante con el email ${postulanteExiste.email}`
          });
          continue;
        } else if(postulanteExiste && postulanteExiste.deleted) {
          postulantes.push({
            postulante: postulanteExiste,
            warning: `El postulante ${postulanteExiste.email} ya existia pero se encuentra en estatus: 'eliminado'. Si desea reinsertarlo comuniquese con el administrador del sistema y proporcionele este ID: ${postulanteExiste._id}`
          });
          continue;
        }
        if(element.github || element.linkedin) {
          element.rrss = [];
          if(element.github) {
            let github = await context.functions.execute('obtenerRedesSocialesPorNombre', "Github");
            let format = {
              red: github,
              url: element.github
            };
            element.rrss.push(format);
          }
          if(element.linkedin) {
            let linkedin = await context.functions.execute('obtenerRedesSocialesPorNombre', "LinkedIn");
            let format = {
              red: linkedin,
              url: element.linkedin
            };
            element.rrss.push(format);
          }
        }
        delete element.github;
        delete element.linkedin;
        element.pais = await context.functions.execute('obtenerPaisPorNombre', `${element.pais}`);
        element.skills = element.skills.split(",");
        const skills = [];
        for (let i = 0; i < element.skills.length; i++) {
          var skill = element.skills[i];
          skill = skill.trim();
          skill = skill.split(":");
          let conocimiento = await context.functions.execute('obtenerConocimientoPorNombre', `${skill[0]}`);
          if(!conocimiento) {
            let collectionConocimientos = context.services
              .get('mongodb-atlas')
              .db(context.environment.values.DB_NAME)
              .collection('conocimientos');
            let { insertedId } = await collectionConocimientos.insertOne({nombre: skill[0]});
            if(!insertedId) {
              throw new Error ('No se pudo crear la conocimiento');
            }
            conocimiento = await context.functions.execute('obtenerConocimientoPorId', `${insertedId}`);
          }
          let format = {
            conocimiento: conocimiento,
            nivel: parseInt(skill[1])
          }
          skills.push(format);
        }
        element.skills = skills;
        element.idiomas = element.idiomas.split(",");
        const idiomas = [];
        for (let i = 0; i < element.idiomas.length; i++) {
          var idioma = element.idiomas[i];
          idioma = idioma.trim();
          idioma = idioma.split(":");
          let lang = await context.functions.execute('obtenerIdiomaPorNombre', `${idioma[0]}`);
          if(!lang) {
            let collectionIdiomas = context.services
              .get('mongodb-atlas')
              .db(context.environment.values.DB_NAME)
              .collection('idiomas');
            let { insertedId } = await collectionIdiomas.insertOne({idioma: idioma[0]});
            if(!insertedId) {
              throw new Error ('No se pudo crear el idioma');
            }
            lang = await context.functions.execute('obtenerIdiomaPorId', `${insertedId}`);
          }
          let format = {
            idioma: lang,
            oral: parseInt(idioma[1]),
            escrito: parseInt(idioma[2])
          }
          idiomas.push(format);
        }
        element.idiomas = idiomas;

        // Se añade código incrementable al postulante
        element.codigo = await context.functions.execute("obtenerSiguienteCodigoPropuesta")
        
        let { insertedId } = await collectionPostulantes.insertOne(element);
        // Se valida el resultado
        if(!insertedId) {
          throw new Error ('No se encontró postulante a agregar');
        }
        const postulante = await context.functions.execute('findPostulantePorId', `${insertedId}`);
        postulantes.push({postulante});
    }
    context.functions.execute('handlerResponse', response, postulantes);
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
};