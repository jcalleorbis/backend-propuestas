// utilizar solo en http endpoints que requieran ser protegidos
exports = async function (request, response) {

  const clientConfig = context.values.get("client_config");
  const origin  = request.headers?.['Origin']?.[0]
  
  if(!origin) throw new Error({ errorMessage: 'Dominio no autorizado', errorCode: 401 })

  if (clientConfig.origins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    throw new Error({ errorMessage: 'Dominio no autorizado', errorCode: 401 })
  }

  const query = request.query
  const clientId = query.apiKey;

  if(!clientId) throw new Error({ errorMessage:'Unauthorized: No se provee un ClientID para ver los recursos.', errorCode: 401 })

  if(clientConfig.clientId !== clientId) throw new Error({ errorMessage: 'Unauthorized: ClientID Incorrecto.', errorCode: 401 })

}