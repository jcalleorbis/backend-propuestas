exports = async function(type){
  try {
    let token = null

    if(type == 'mail') {
      const gcpConfig = context.values.get("oauth_config");
      const urlOAuth = "https://oauth2.googleapis.com/token";
      
      const body = {
        client_secret: gcpConfig.client_secret,
        grant_type: "refresh_token",
        refresh_token: gcpConfig.refresh_token,
        client_id: gcpConfig.client_id
      };

      const response = await context.http.post({
        url: urlOAuth,
        body,
        encodeBodyAsJSON: true
      });
      console.log("sin firmar");
      const data = EJSON.parse(response.body.text());
      token = data.access_token;
    } else {
      console.log("firmado");
      const data = await context.functions.execute("firmarTokenOauth")
      token = data.access_token;
    }


    return token;
  } catch (err) {
    console.error(JSON.stringify(err));
    context.functions.execute('handleError', "internal_server_error", "Error consultando la api de autenticación de Google", 500);
  }
};