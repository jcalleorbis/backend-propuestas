exports = async function(request, response){
  try {
    const { query, headers, body } = request
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)

    if (!body.text()) throw new Error ('No se esta enviando el body en el request');
    const data = JSON.parse(body.text())
    console.log(data.file)
    const bufferExcel = Buffer.from(data.file,'base64');
    const xlsx = require("node-xlsx");
    const workSheetsFromBuffer = xlsx.parse(bufferExcel, {
      type: 'buffer',
    });
    context.functions.execute('handlerResponse', response, workSheetsFromBuffer);
  } catch (err) {
    context.functions.execute('handleError', "internal_server_error", err.message, 500);
  }
};