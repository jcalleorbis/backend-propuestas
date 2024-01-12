exports = function ({ codigoDefault, maxTiempoExpiracion = 3, tipoExpiracion = 'days', requireFirma = false }) {
  const now = require("moment");
  const uuid = require("uuid")

  let codigo = codigoDefault || uuid.v4()
  const fechaGeneracion = now().toDate()
  const fechaExpiracion = now().add(maxTiempoExpiracion, tipoExpiracion).toDate()

  if(requireFirma) {
    codigo = context.functions.execute("generateToken", {
      codigo,
      fechaGeneracion,
      fechaExpiracion
    })
  }

  return {
    codigo,
    fechaGeneracion,
    fechaExpiracion,
  }
};
