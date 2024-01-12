exports = async function(request, response){
  try {
    const { query, headers, body } = request
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    
    const postulantes = context.services
      .get('mongodb-atlas')
      .db(context.environment.values.DB_NAME)
      .collection('propuestas');
    const tipos = context.services
        .get('mongodb-atlas')
        .db(context.environment.values.DB_NAME)
        .collection('agrupaciones-concepto');
    const conocimientos = context.services
        .get('mongodb-atlas')
        .db(context.environment.values.DB_NAME)
        .collection('conocimientos');
    for (let i = 0; i < postulantes.length; i++) {
          const element = postulantes[i];
          if (element.skills) {
              for (let j = 0; j < element.skills.length; j++) {
                  const skill = element.skills[j];
                  var filter;
                  if (skill.conocimiento) {
                      if (!skill.tipo) {
                          switch (skill.conocimiento.nombre) {
                              case "React":
                                  filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "React Native":
                                  filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Flutter":
                                  filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "NodeJS":
                                  filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "VueJS":
                                  filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Spring Boot":
                                  filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Flask":
                                  filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Angular":
                                  filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "NextJS":
                                  filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Laravel":
                                  filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Selenium":
                                  filter = tipos.filter(tipo => tipo.nombre == "Automatización");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Automation Anywhere 365":
                                  filter = tipos.filter(tipo => tipo.nombre == "Automatización");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "MySQL":
                                  filter = tipos.filter(tipo => tipo.nombre == "Base de Datos");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "MongoDB":
                                  filter = tipos.filter(tipo => tipo.nombre == "Base de Datos");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "SQL Server":
                                  filter = tipos.filter(tipo => tipo.nombre == "Base de Datos");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Oracle":
                                  filter = tipos.filter(tipo => tipo.nombre == "Base de Datos");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "SQL":
                                  filter = tipos.filter(tipo => tipo.nombre == "Base de Datos");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "DevOps":
                                  filter = tipos.filter(tipo => tipo.nombre == "Conocimientos de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "APIS":
                                  filter = tipos.filter(tipo => tipo.nombre == "Conocimientos de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Gitlab":
                                  filter = tipos.filter(tipo => tipo.nombre == "Control de Versiones");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Git":
                                  filter = tipos.filter(tipo => tipo.nombre == "Control de Versiones");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "PMI":
                                  filter = tipos.filter(tipo => tipo.nombre == "Gestion de Proyectos");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Scrum":
                                  filter = tipos.filter(tipo => tipo.nombre == "Gestion de Proyectos");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Google Cloud":
                                  filter = tipos.filter(tipo => tipo.nombre == "Infraestructura");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "AWS Lambda":
                                  filter = tipos.filter(tipo => tipo.nombre == "Infraestructura");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "AWS":
                                  filter = tipos.filter(tipo => tipo.nombre == "Infraestructura");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Jentkins":
                                  filter = tipos.filter(tipo => tipo.nombre == "Infraestructura");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "ArgoCD":
                                  filter = tipos.filter(tipo => tipo.nombre == "Infraestructura");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "HTML":
                                  filter = tipos.filter(tipo => tipo.nombre == "Lenguajes de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "CSS":
                                  filter = tipos.filter(tipo => tipo.nombre == "Lenguajes de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Javascript":
                                  filter = tipos.filter(tipo => tipo.nombre == "Lenguajes de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Python":
                                  filter = tipos.filter(tipo => tipo.nombre == "Lenguajes de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Java":
                                  filter = tipos.filter(tipo => tipo.nombre == "Lenguajes de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "C#":
                                  filter = tipos.filter(tipo => tipo.nombre == "Lenguajes de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "PHP":
                                  filter = tipos.filter(tipo => tipo.nombre == "Lenguajes de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Go":
                                  filter = tipos.filter(tipo => tipo.nombre == "Lenguajes de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Typescript":
                                  filter = tipos.filter(tipo => tipo.nombre == "Lenguajes de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "IOS":
                                  filter = tipos.filter(tipo => tipo.nombre == "Sistemas Operativos");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Android":
                                  filter = tipos.filter(tipo => tipo.nombre == "Sistemas Operativos");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Jmeter":
                                  filter = tipos.filter(tipo => tipo.nombre == "Tests");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              default:
                                  postulantes[i].skills[j].conocimiento.tipo = {};
                                  break;
                          }   
                      }
                      postulantes[i].skills[j].conocimiento = postulantes[i].skills[j].conocimiento;
                      delete postulantes[i].skills[j].conocimiento;
                  } else if (skill.conocimiento) {
                      if (!skill.tipo) {
                          switch (skill.conocimiento.nombre) {
                              case "React":
                                  filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "React Native":
                                  filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Flutter":
                                  filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "NodeJS":
                                  filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "VueJS":
                                  filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Spring Boot":
                                  filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Flask":
                                  filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Angular":
                                  filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "NextJS":
                                  filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Laravel":
                                  filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Selenium":
                                  filter = tipos.filter(tipo => tipo.nombre == "Automatización");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Automation Anywhere 365":
                                  filter = tipos.filter(tipo => tipo.nombre == "Automatización");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "MySQL":
                                  filter = tipos.filter(tipo => tipo.nombre == "Base de Datos");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "MongoDB":
                                  filter = tipos.filter(tipo => tipo.nombre == "Base de Datos");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "SQL Server":
                                  filter = tipos.filter(tipo => tipo.nombre == "Base de Datos");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Oracle":
                                  filter = tipos.filter(tipo => tipo.nombre == "Base de Datos");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "SQL":
                                  filter = tipos.filter(tipo => tipo.nombre == "Base de Datos");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "DevOps":
                                  filter = tipos.filter(tipo => tipo.nombre == "Conocimientos de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "APIS":
                                  filter = tipos.filter(tipo => tipo.nombre == "Conocimientos de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Gitlab":
                                  filter = tipos.filter(tipo => tipo.nombre == "Control de Versiones");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Git":
                                  filter = tipos.filter(tipo => tipo.nombre == "Control de Versiones");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "PMI":
                                  filter = tipos.filter(tipo => tipo.nombre == "Gestion de Proyectos");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Scrum":
                                  filter = tipos.filter(tipo => tipo.nombre == "Gestion de Proyectos");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Google Cloud":
                                  filter = tipos.filter(tipo => tipo.nombre == "Infraestructura");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "AWS Lambda":
                                  filter = tipos.filter(tipo => tipo.nombre == "Infraestructura");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "AWS":
                                  filter = tipos.filter(tipo => tipo.nombre == "Infraestructura");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Jentkins":
                                  filter = tipos.filter(tipo => tipo.nombre == "Infraestructura");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "ArgoCD":
                                  filter = tipos.filter(tipo => tipo.nombre == "Infraestructura");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "HTML":
                                  filter = tipos.filter(tipo => tipo.nombre == "Lenguajes de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "CSS":
                                  filter = tipos.filter(tipo => tipo.nombre == "Lenguajes de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Javascript":
                                  filter = tipos.filter(tipo => tipo.nombre == "Lenguajes de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Python":
                                  filter = tipos.filter(tipo => tipo.nombre == "Lenguajes de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Java":
                                  filter = tipos.filter(tipo => tipo.nombre == "Lenguajes de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "C#":
                                  filter = tipos.filter(tipo => tipo.nombre == "Lenguajes de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "PHP":
                                  filter = tipos.filter(tipo => tipo.nombre == "Lenguajes de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Go":
                                  filter = tipos.filter(tipo => tipo.nombre == "Lenguajes de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Typescript":
                                  filter = tipos.filter(tipo => tipo.nombre == "Lenguajes de Programación");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "IOS":
                                  filter = tipos.filter(tipo => tipo.nombre == "Sistemas Operativos");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Android":
                                  filter = tipos.filter(tipo => tipo.nombre == "Sistemas Operativos");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              case "Jmeter":
                                  filter = tipos.filter(tipo => tipo.nombre == "Tests");
                                  postulantes[i].skills[j].conocimiento.tipo = filter[0];
                                  break;
                              default:
                                  postulantes[i].skills[j].conocimiento.tipo = {};
                                  break;
                          }   
                      }
                  }
              }
          } else {
              postulantes[i].skills = [];
          }
          const queryUpdate = { _id: BSON.ObjectId(element._id) };
          parseBody = postulantes[i];
          const update = {
            $set: parseBody
          };
          const options = {
              "upsert": false
          };
          const { matchedCount, modifiedCount } = await postulantes.updateOne(queryUpdate, parseBody, options);
      }
    for (let i = 0; i < conocimientos.length; i++) {
        const conocimiento = conocimientos[i];
        let filter;
        switch (conocimiento.nombre) {
            case "React":
                filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                conocimientos[i].tipo = filter[0];
                break;
            case "React Native":
                filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                conocimientos[i].tipo = filter[0];
                break;
            case "Flutter":
                filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                conocimientos[i].tipo = filter[0];
                break;
            case "NodeJS":
                filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                conocimientos[i].tipo = filter[0];
                break;
            case "VueJS":
                filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                conocimientos[i].tipo = filter[0];
                break;
            case "Spring Boot":
                filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                conocimientos[i].tipo = filter[0];
                break;
            case "Flask":
                filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                conocimientos[i].tipo = filter[0];
                break;
            case "Angular":
                filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                conocimientos[i].tipo = filter[0];
                break;
            case "NextJS":
                filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                conocimientos[i].tipo = filter[0];
                break;
            case "Laravel":
                filter = tipos.filter(tipo => tipo.nombre == "Frameworks o Librerias de Programación");
                conocimientos[i].tipo = filter[0];
                break;
            case "Selenium":
                filter = tipos.filter(tipo => tipo.nombre == "Automatización");
                conocimientos[i].tipo = filter[0];
                break;
            case "Automation Anywhere 365":
                filter = tipos.filter(tipo => tipo.nombre == "Automatización");
                conocimientos[i].tipo = filter[0];
                break;
            case "MySQL":
                filter = tipos.filter(tipo => tipo.nombre == "Base de Datos");
                conocimientos[i].tipo = filter[0];
                break;
            case "MongoDB":
                filter = tipos.filter(tipo => tipo.nombre == "Base de Datos");
                conocimientos[i].tipo = filter[0];
                break;
            case "SQL Server":
                filter = tipos.filter(tipo => tipo.nombre == "Base de Datos");
                conocimientos[i].tipo = filter[0];
                break;
            case "Oracle":
                filter = tipos.filter(tipo => tipo.nombre == "Base de Datos");
                conocimientos[i].tipo = filter[0];
                break;
            case "SQL":
                filter = tipos.filter(tipo => tipo.nombre == "Base de Datos");
                conocimientos[i].tipo = filter[0];
                break;
            case "DevOps":
                filter = tipos.filter(tipo => tipo.nombre == "Conocimientos de Programación");
                conocimientos[i].tipo = filter[0];
                break;
            case "APIS":
                filter = tipos.filter(tipo => tipo.nombre == "Conocimientos de Programación");
                conocimientos[i].tipo = filter[0];
                break;
            case "Gitlab":
                filter = tipos.filter(tipo => tipo.nombre == "Control de Versiones");
                conocimientos[i].tipo = filter[0];
                break;
            case "Git":
                filter = tipos.filter(tipo => tipo.nombre == "Control de Versiones");
                conocimientos[i].tipo = filter[0];
                break;
            case "PMI":
                filter = tipos.filter(tipo => tipo.nombre == "Gestion de Proyectos");
                conocimientos[i].tipo = filter[0];
                break;
            case "Scrum":
                filter = tipos.filter(tipo => tipo.nombre == "Gestion de Proyectos");
                conocimientos[i].tipo = filter[0];
                break;
            case "Google Cloud":
                filter = tipos.filter(tipo => tipo.nombre == "Infraestructura");
                conocimientos[i].tipo = filter[0];
                break;
            case "AWS Lambda":
                filter = tipos.filter(tipo => tipo.nombre == "Infraestructura");
                conocimientos[i].tipo = filter[0];
                break;
            case "AWS":
                filter = tipos.filter(tipo => tipo.nombre == "Infraestructura");
                conocimientos[i].tipo = filter[0];
                break;
            case "Jentkins":
                filter = tipos.filter(tipo => tipo.nombre == "Infraestructura");
                conocimientos[i].tipo = filter[0];
                break;
            case "ArgoCD":
                filter = tipos.filter(tipo => tipo.nombre == "Infraestructura");
                conocimientos[i].tipo = filter[0];
                break;
            case "HTML":
                filter = tipos.filter(tipo => tipo.nombre == "Lenguajes de Programación");
                conocimientos[i].tipo = filter[0];
                break;
            case "CSS":
                filter = tipos.filter(tipo => tipo.nombre == "Lenguajes de Programación");
                conocimientos[i].tipo = filter[0];
                break;
            case "Javascript":
                filter = tipos.filter(tipo => tipo.nombre == "Lenguajes de Programación");
                conocimientos[i].tipo = filter[0];
                break;
            case "Python":
                filter = tipos.filter(tipo => tipo.nombre == "Lenguajes de Programación");
                conocimientos[i].tipo = filter[0];
                break;
            case "Java":
                filter = tipos.filter(tipo => tipo.nombre == "Lenguajes de Programación");
                conocimientos[i].tipo = filter[0];
                break;
            case "C#":
                filter = tipos.filter(tipo => tipo.nombre == "Lenguajes de Programación");
                conocimientos[i].tipo = filter[0];
                break;
            case "PHP":
                filter = tipos.filter(tipo => tipo.nombre == "Lenguajes de Programación");
                conocimientos[i].tipo = filter[0];
                break;
            case "Go":
                filter = tipos.filter(tipo => tipo.nombre == "Lenguajes de Programación");
                conocimientos[i].tipo = filter[0];
                break;
            case "Typescript":
                filter = tipos.filter(tipo => tipo.nombre == "Lenguajes de Programación");
                conocimientos[i].tipo = filter[0];
                break;
            case "IOS":
                filter = tipos.filter(tipo => tipo.nombre == "Sistemas Operativos");
                conocimientos[i].tipo = filter[0];
                break;
            case "Android":
                filter = tipos.filter(tipo => tipo.nombre == "Sistemas Operativos");
                conocimientos[i].tipo = filter[0];
                break;
            case "Jmeter":
                filter = tipos.filter(tipo => tipo.nombre == "Tests");
                conocimientos[i].tipo = filter[0];
                break;
            default:
                conocimientos[i].tipo = {};
                break;
        }
        const options = {
            "upsert": false
        };
        const { matchedCount, modifiedCount } = await db.collection("conocimientos").updateOne({
            _id: BSON.ObjectId(`${conocimiento._id}`)
        }, {$set: conocimientos[i]}, options);
    }  
    const postulantesUpdated = context.services
        .get('mongodb-atlas')
        .db(context.environment.values.DB_NAME)
        .collection('propuestas');
        context.functions.execute('handlerResponse', response, postulantesUpdated);
  } catch(err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
};