const errorCodes = {
  "100": {
    CODE: 100,
    STATUS: 'UNREGISTERED',
    MESSAGE: 'Cuenta no registrada'
  },
  "101": {
    CODE: 101,
    STATUS: 'INACTIVE',
    MESSAGE: 'Cuenta inhabilitada'
  },
  "102": {
    CODE: 102,
    STATUS: 'ERR_AUTH_TYPE',
    MESSAGE: 'Tipo Auth Inválido'
  },
  "103": {
    CODE: 103,
    STATUS: 'ERR_SERVICE',
    MESSAGE: 'Credenciales inválidas de servicio Auth'
  },
  "104": {
    CODE: 104,
    STATUS: 'INVALID_PASSWORD',
    MESSAGE: 'Contraseña incorrecta'
  },
}

const validateLoginRecapp = (user, password) => {
  const isValidPassword = context.functions.execute('validatePassword', password, user.password);
      
  if (!isValidPassword) {
    throw new Error({
      message: 'La contraseña es incorrecta',
      error: errorCodes['104']
    });
  }
}

const validLoginGoogle = (data) => {
  if (!data.servicioAuth)
    throw new Error({
      message: `El email ${data.email} no cuenta con credenciales de una autenticación de Google.`,
      error: errorCodes['103']
    });
  if (!data.servicioAuth?.access_token)
    throw new Error({
      message: "Credenciales faltantes para una autenticación de Google",
      error: errorCodes['103']
    });
  if (!data.servicioAuth?.user)
    throw new Error({
      message: "Credenciales faltantes para una autenticación de Google",
      error: errorCodes['103']
    });
};

exports = ({ email, password, user, tipoAuth }) => {
  const recappConfig = context.values.get("recapp_config")
  const validLogins = {
    [recappConfig.tipo_auth_default]: validateLoginRecapp,
    [recappConfig.tipo_auth_google]: validLoginGoogle,
  };

  if (!user) 
    throw new Error({
      message: `El email ${email} no existe`,
      error: errorCodes['100']
    });
  if (user.activo === false)
    throw new Error({
      message: "Su cuenta se encuentra deshabilitada",
      error: errorCodes['101']
    });
  if (!tipoAuth)
    throw new Error({
      message: "No se proporcionó un tipo de Autenticación",
      error: errorCodes['102']
    });
  if (user.tipoAuth != tipoAuth)
    throw new Error({
      message: "Su tipo de registro no permite este tipo de Inicio de sesión",
      error: errorCodes['102']
    });
  if (validLogins[tipoAuth]) {
    validLogins[tipoAuth](user, password);
  }
};
