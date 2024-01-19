exports = async function (folderNames, parentId, token){
    
  const url = `https://us-central1-recapporbisperu.cloudfunctions.net/function-1`;

  const headers = {
    'token-auth':[ `Bearer ${token}` ]
  };

  const body = {
    folderNames: folderNames,
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