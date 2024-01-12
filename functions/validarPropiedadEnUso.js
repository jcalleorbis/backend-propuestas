
exports = async function ({ collection, value = '', key = 'email', extraParams = {}, regexOptions = "ix" })  {
  const results = await collection.find({ [key]: { "$regex": value, "$options": regexOptions }, ...extraParams }).toArray()
  let isUse = false

  for(const document of results) {
    if(isUse) continue
    if(String(document?.[key]).toLowerCase() == value?.toLowerCase()) {
      isUse = true
    }
  }

  return isUse
}