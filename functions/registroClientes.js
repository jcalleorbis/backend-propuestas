exports = async function(request, response){
 try {
    const { body } = request
    await context.functions.execute("middlewareVerificarOrigenClientId", request, response)

    const passwordHash = require('password-hash');
    if (!body || !body.text()) throw new Error ('No se esta enviando el body en el request');
    const {email, password} = JSON.parse(body.text());

    const collectionClientes = context.services
        .get('mongodb-atlas')
        .db(context.environment.values.DB_NAME)
        .collection('usuario');
        
    const user = await collectionClientes.findOne({ email });
    
    if(user != null)
      throw new Error ('Usuario ya existe')
      
    let hashedPassword = await passwordHash.generate(password);
    
    let userDocument = {
      "email": email,
      "password": hashedPassword
    }
    console.log('hashedPassword',hashedPassword)
    console.log('documento',userDocument)
        
    const registro = await collectionClientes.insertOne(userDocument)

   context.functions.execute('handlerResponse', response, registro);
  } catch (err) {
    context.functions.execute('handlerResponse', response, null, 400, false, err.message);
  }
};