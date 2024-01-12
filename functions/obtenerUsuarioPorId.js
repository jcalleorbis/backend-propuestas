exports = async (userId) => {
  if(!userId) return null

  const collectionUsuarios = context.functions.execute("getCollectionInstance", "usuario")
  const collectionPerfiles = context.functions.execute("getCollectionInstance", "perfiles")

  const usuario = await collectionUsuarios.findOne({ _id: BSON.ObjectId(userId), deleted: { $ne: true }, activo: { $ne: false } })
  if(usuario?.perfil) {
    usuario.perfil = await collectionPerfiles.findOne({ _id: BSON.ObjectId(usuario.perfil.toString()) })
  }

  return usuario || null
}