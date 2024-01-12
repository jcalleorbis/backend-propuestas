exports = async function hashPassword(request, response) {
  try {
    const { body } = request;
    const passwordHash = require("password-hash");

    const { password } = JSON.parse(body.text());
    
    if (!password)
      throw new Error("Password no encontrada en el cuerpo de la consulta");

    const hashedPassword = await passwordHash.generate(password);

    context.functions.execute("handlerResponse", response, hashedPassword);
  } catch (err) {
    context.functions.execute(
      "handlerResponse",
      response,
      null,
      400,
      false,
      err.message
    );
  }
};
