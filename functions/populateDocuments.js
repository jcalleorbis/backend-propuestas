// populateList = [ { ref: "Atributo a poblar", collection: "Nombre de la coleccion", fieldsOptions?: {} } ]
// El resultado de la poblacion será () => ref + 'Doc' = "nombreRefDoc"

exports = async function ({ results, populateList = [] }) {
  
  if(!populateList || populateList?.length == 0) return results
  if (!results) return null;
  
  const isArray = Array.isArray(results);
  
  if (typeof results !== "object" && !isArray) return null; // si no es array u object
  
  results = !isArray ? [results] : results;

  let mapper = new Map();

  let currentId = undefined;
  for (const document of results) {
    for (const populateItem of populateList) {
      currentId = document?.[populateItem.ref]?.toString();
      if (!currentId) continue;
      if (!mapper.get(populateItem.ref)) {
        // no existe en mapper
        mapper.set(populateItem.ref, {});
      }
      // existe en mapper
      mapper.set(populateItem.ref, {
        ...mapper.get(populateItem.ref),
        [currentId]: BSON.ObjectId(currentId),
      });
    }
  }

  const mapperResObjs = new Map();

  for (const populateItem of populateList) {
    const mapIds = mapper.get(populateItem.ref);
    if (!mapIds || Object.keys(mapIds).length == 0) continue;

    let filter = { $or: [] };
    Object.entries(mapIds).forEach(([key, value]) => {
      filter.$or.push({ _id: value });
    });
    const collection = context.functions.execute(
      "getCollectionInstance",
      populateItem.collection
    );
    if(filter.$or.length == 0) continue
    const fieldsOptions = populateItem?.fieldsOptions || {}
    const resultsNested = await collection.find(filter, fieldsOptions).toArray();
    mapperResObjs.set(populateItem.ref, resultsNested);
  }

  for (const document of results) {
    for (const populateItem of populateList) {
      const foundDocRef = mapperResObjs
        .get(populateItem.ref)
        ?.find(
          (doc) =>
            doc._id?.toString() == document?.[populateItem.ref]?.toString()
        );
      if (!foundDocRef) continue;
      document[`${populateItem.ref}Doc`] = foundDocRef;
    }
  }

  return isArray ? results : results?.[0];
};
