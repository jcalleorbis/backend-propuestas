exports = async function ({ postulanteId, email }) {
  const existeMail = await context.functions.execute("obtenerDocumentoPorQuery", {
    query: {
      _id: { $ne: postulanteId },
      email: { $regex: email, "$options": 'i' },
      deleted: { $ne: true }
    },
    collectionName: 'postulantes'
  })
  return Boolean(existeMail)
}