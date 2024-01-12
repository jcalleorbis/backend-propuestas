/**
 * Funcion para manejar y estandarizar las respuestas de los endpoints
 * @param {Response} response - Objeto response de la consulta
 * @param {any} data - La data a enviar en el body al usuario
 * @param {number} status - Status code de la consulta
 * @param {boolean} success - Boolean para definir si la consulta ha sido correcta o erronea
 * @param {string} message - Mensaje con informacion de la consulta
 * @author Rodrigo Berrios
 * @date 2022-11-09
 */

 exports = function(response, data = null, status = 200, success = true, message = 'La solicitud se realizó de manera correcta'){
  const objResponse = {
    status,
    data,
    success,
    message
  };
  
  response.setHeader(
    "Content-Type",
    "application/json"
  );
  
  response.setHeader(
    "Access-Control-Allow-Origin", "*"
  );
  
  response.setHeader(
    "Access-Control-Allow-Headers", "Content-Type"
  );
  
  response.setHeader(
    "Access-Control-Allow-Methods", "OPTIONS,POST,GET,PUT,DELETE,PATCH"
  );
  
  response
    .setStatusCode(status)
    .setBody(JSON.stringify(objResponse));
};