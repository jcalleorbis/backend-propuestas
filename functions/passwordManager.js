const hashPassword = async ({ password }) => {
  const bcrypt = require("bcrypt")
  const passwordConfig = context.values.get("password_config")
  
  if(!password) throw new Error("La contraseña es requerida para crear un hash")
  if(!passwordConfig) throw new Error("Archivo password_config no encontrado")
  if(!passwordConfig.salts) throw new Error("Parámetro 'salts' no encontrado")
  
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, passwordConfig.salts, function(err, hash) {
      if(err) reject("La contraseña no se pudo hashear")
      resolve(hash)
    });
  })
}

const comparePasswords = async ({ password, passwordHashed }) => {
  const bcrypt = require("bcrypt")
  const match = await bcrypt.compare(password, passwordHashed);
  return match
}

exports = async function (tipo, payload) { // { tipo: string, payload: { password, passwordHashed? } }
  const tipos = {
    "crearHash": hashPassword,
    "compararHash": comparePasswords,
  }
  if(!tipos?.[tipo]) throw new Error("Inesperado tipo de Password Manager")
  const result = await tipos?.[tipo](payload)
  return result
}