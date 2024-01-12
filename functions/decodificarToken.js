
exports = async function (token) {
  try {
    const jwtConfig = context.values.get("jwt_config");
    const jwt = require('jsonwebtoken');
  
    const decoded = await jwt.verify(token, jwtConfig.secret);
    return decoded
    
  } catch (error) {
    return null
  }
}