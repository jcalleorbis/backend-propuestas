exports = function(password, hashedPassword){
  const passwordHash = require('password-hash');
  return passwordHash.verify(password, hashedPassword);
};