exports = async function (fileBuffer, fileName, contentType, parentId, token){
    
    const url = `https://us-central1-recapporbisperu.cloudfunctions.net/new-file`;
  
    const headers = {
      'token-auth':[ `Bearer ${token}` ]
    };
  
    const body = {
        fileBuffer: fileBuffer,
        fileName: fileName,
        contentType: contentType,
        parentId: parentId
    };
    
    const response = await context.http.post({
      url,
      headers,
      body,
      encodeBodyAsJSON: true
    });
  
      return {
        status: response.statusCode,
        data: EJSON.parse(response.body.text())
      };
  
  };