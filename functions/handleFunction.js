exports = async function(callback){
  return async function (req, res) {
    try {
      await callback(req, res);
    } catch (err) {
      context.functions.execute('handlerResponse', res, null, err.statusCode || 500, false, err.message);
      console.error(err);
    }
  };
};