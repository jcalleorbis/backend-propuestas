exports = async function(filename, mimetype, buffer){
  const token = await context.functions.execute('getTokenOAuth');
  const gcpConfig = context.values.get("gcp_config");
  const bucket = gcpConfig.bucket;
  
  const url = `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?name=${filename}&uploadType=multipart`;
  const headers = {
    Authorization: [
      `Bearer ${token}`
    ],
    'Content-Type':[ mimetype ]
  };
  const body = buffer;
  
  const response = await context.http.post({
    url,
    headers,
    body,
  });

  if(response.statusCode != 200) throw new Error(`Google Storage: ${response.status}`)

  return `/${filename}`;
};