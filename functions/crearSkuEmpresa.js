exports = async function ({ nombreEmpresa, empresaId }) {
  const slugify = require("slugify");
  const sku = slugify(nombreEmpresa, {
    lower: true,
    trim: true
  });
  const collectionEmpresas = context.functions.execute(
    "getCollectionInstance",
    "empresas"
  );
  const query = {
    sku: sku,
    deleted: { $ne: true },
  };
  if (empresaId) query._id = { $ne: BSON.ObjectId(empresaId) };
  const existe = await collectionEmpresas.findOne(query);
  if (existe) throw new Error("El nombre de la empresa se encuentra en uso");
  return sku;
};
