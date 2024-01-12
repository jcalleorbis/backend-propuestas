const formatObjectName = (path) => {
  if (!path) throw new Error("El path es requerido para la eliminación")
  let url = String(path)
  if(path[0] == '/') url = url.slice(1)
  url = url.replace(/\//g, "%2F")
  return url
}

exports = async function(path){
  try {
    const token = await context.functions.execute('getTokenOAuth');
    const gcpConfig = context.values.get("gcp_config");
    const bucket = gcpConfig.bucket;
    const objectName = formatObjectName(path)
    
    const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${objectName}`;
    const headers = {
      Authorization: [
        `Bearer ${token}`
      ],
      'Content-Type':[ 'application/json' ]
    };

    const response = await context.http.delete({
      url,
      headers,
    });

    if(response.statusCode != 204) throw new Error(`Google Storage: ${response.status}`)

    return true
  } catch (error) {
    console.log("Error al remover file:", error);
    return false
  }
};