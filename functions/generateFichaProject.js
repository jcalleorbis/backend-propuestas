exports = async function(request, response){
    try {
        const { headers, body } = request
        await context.functions.execute("middlewareVerificarOrigenClientId", request, response)
    
        // middleware validación token
        await context.functions.execute("middlewareVerificarToken", headers, response)
    
        const data = validate(JSON.parse(request.body.text()));

        //Primero obtener la propuesta

        const collectionPostulantes = context.services
        .get('mongodb-atlas')
        .db(context.environment.values.DB_NAME)
        .collection('propuestas');
  
        let query = {
            _id: BSON.ObjectId(data.propuesta_id),
        }
        
        const propuesta = await collectionPostulantes.findOne(query);

        //Obtener la empresa

        const collectionEmpresas = context.services
        .get('mongodb-atlas')
        .db(context.environment.values.DB_NAME)
        .collection('empresas');

        query = {
            _id: propuesta.empresa,
        }

        const empresa = await collectionEmpresas.findOne(query);

        //Obtener logo de la empresa

        //Obtener al cliente

        const collectionClientes = context.services
        .get('mongodb-atlas')
        .db(context.environment.values.DB_NAME)
        .collection('clientes');

        query = {
            _id: BSON.ObjectId(propuesta.cliente._id),
        }

        const cliente = await collectionClientes.findOne(query);
        
        //Crear json para envio al servicio de creación de propuestas

        let include = {
            "logo_empresa": empresa.logo?true: false,
            "logo_cliente": cliente.logo?true: false,
            "testimonio": propuesta.testimonios_cliente && Array.isArray(propuesta.testimonios_cliente) && propuesta.testimonios_cliente.length > 0?true: false,
            "objetivos": propuesta.objetivos && Array.isArray(propuesta.objetivos) && propuesta.objetivos.length > 0?true: false,
            "beneficios": propuesta.beneficios && Array.isArray(propuesta.beneficios) && propuesta.beneficios.length > 0?true: false
        }

        if(empresa.ficha){
            include = {
                "logo_empresa": include.logo_empresa && empresa.ficha.logo_empresa,
                "logo_cliente": include.logo_cliente && empresa.ficha.logo_cliente,
                "testimonio": include.testimonio && empresa.ficha.testimonio,
                "objetivos": include.objetivos && empresa.ficha.objetivos_cliente,
                "beneficios": include.beneficios && empresa.ficha.beneficios_proyecto
            }
        }

        include = {
            "logo_empresa": include.logo_empresa == true?"1": "0",
            "logo_cliente": include.logo_cliente == true?"1": "0",
            "testimonio": include.testimonio == true?"1": "0",
            "objetivos": include.objetivos == true?"1": "0",
            "beneficios": include.beneficios == true?"1": "0",
        }

        const ficha_project_request = {
            "empresa": {
                "phone": "",
                "web": empresa.website || "",
                "email": empresa.email || "",
                "logo": empresa.logo?`https://storage.googleapis.com/recapp-dev${empresa.logo}`:''
            },
            "cliente": {
                "nombre": cliente.nombre || "",
                "logo": cliente.logo|| ""
            },
            "nombre_propuesta": propuesta.nombre_propuesta || "",
            "observaciones": propuesta.observaciones || "",
            "desafio": propuesta.desafios_cliente || "",
            "objetivos": propuesta.objetivos && Array.isArray(propuesta.objetivos) && propuesta.objetivos.length > 0?propuesta.objetivos.map((item)=>{
                return {
                    "name": item.objetivo
                }
            }): "",
            "solution": propuesta.solucion_cliente || "",
            "beneficios": propuesta.beneficios && Array.isArray(propuesta.beneficios) && propuesta.beneficios.length > 0?propuesta.beneficios.map((item)=>{
                return {
                    "beneficio": item.beneficio,
                    "percent": String(item.porcentaje)
                }
            }): "",
            "testimonio": propuesta.testimonios_cliente && Array.isArray(propuesta.testimonios_cliente) && propuesta.testimonios_cliente.length > 0?propuesta.testimonios_cliente[0]: "",
            "include": include
        }
        //Generate word base64
        const responsebase64 = await context.http.post({
            url: "https://jobkip.com/orbiscom/generate_ficha_project",
            body: ficha_project_request,
            encodeBodyAsJSON: true
          });
        const base64 = responsebase64.body.text();

        //Upload file to google drive
        const folderId = propuesta.folders.find((item)=> item.updateFiles == true).id;
        const filename = `ficha_proyecto_${propuesta._id}.docx`;
    
        const driveToken = data.token;
        
        const fileStr = await context.functions.execute('subirArchivoDrive', `base64,${base64}`, filename, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', folderId, driveToken);
        const url_file = `https://docs.google.com/document/d/${fileStr.data.id}`
        context.functions.execute('handlerResponse', response, url_file);
    } catch (err) {
      if(err.message === "eliminado") {
        context.functions.execute('handlerResponse', response, null, 404, false, null);
      } else {
        context.functions.execute('handlerResponse', response, null, 400, false, err.message);
      }
    }
  };
  
  const validate = ({ propuesta_id, token }) => {
    if (!propuesta_id) throw new Error("Debe añadir la propuestaId");
    if (!token) throw new Error("Debe enviar el token");
    return { propuesta_id, token };
  };