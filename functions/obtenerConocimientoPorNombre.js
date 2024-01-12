exports = async function (conocimiento) {
  const data = context.services
    .get("mongodb-atlas")
    .db(context.environment.values.DB_NAME)
    .collection("conocimientos");
  const resultado = await data.findOne({
    nombre: { $regex: `^${conocimiento}$`, $options: "i" },
    deleted: { $ne: true },
  });
  return resultado;
};
