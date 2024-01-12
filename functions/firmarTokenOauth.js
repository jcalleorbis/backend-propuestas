exports = async function () {
  const { createSign } = require("crypto");
  const buffer = require('buffer').Buffer
  const base64url = require('base64url');
  const oauthConfig = context.values.get("oauth_config");

  const sign = createSign("SHA256");

  const encodedHeader = JSON.stringify({ alg: "RS256", typ: "JWT" });
  const currentDateInSeconds = (new Date().getTime()/1000)
  const maxSeconds = 3400
  const encodedBody = JSON.stringify({
    iss: "recapp@recapporbisperu.iam.gserviceaccount.com",
    scope: "https://mail.google.com/ https://www.googleapis.com/auth/devstorage.full_control",
    aud: "https://oauth2.googleapis.com/token",
    exp: currentDateInSeconds + maxSeconds,
    iat: currentDateInSeconds
  });

  const base64Data = `${base64url.fromBase64(buffer.from(encodedHeader, 'utf-8').toString('base64'))}.${base64url.fromBase64(buffer.from(encodedBody, 'utf-8').toString('base64'))}`
  sign.update(base64Data);
  const signature = sign.sign(oauthConfig.private_key);
  const signBase64 = base64url.fromBase64(buffer.from(signature).toString("base64"))
  const finalJWT = `${base64Data}.${signBase64}`

  const params = {
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: finalJWT
  }

  const headers = {
    "Content-Type": ["application/x-www-form-urlencoded"]
  }

  const url = `https://oauth2.googleapis.com/token?grant_type=${[params.grant_type]}&assertion=${params.assertion}`

  const googleResponse = await context.http.post({
    url,
    headers,
  });

  if(googleResponse.statusCode != 200) throw new Error("Error generando el token de acceso")
  
  const eJSONGoogleResponse = EJSON.parse(googleResponse.body.text());

  if(!eJSONGoogleResponse.access_token) throw new Error("Error generando el token de acceso")

  return eJSONGoogleResponse

};
