exports = function(req, res){
  const data = JSON.parse(req.body.text());
  context.functions.execute('handlerResponse', res, {"Hola": 123});
};