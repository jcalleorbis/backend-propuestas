exports = function(payload){
  const jwtConfig = context.values.get("jwt_config");
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(payload, jwtConfig.secret);
  return token;
};