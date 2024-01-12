
const getGoogleTransporterOptions = async (mailConfig) => {
  const accessToken = await context.functions.execute('getTokenOAuth', 'mail');
  return {
    host: mailConfig.host,
    port: mailConfig.port,
    secure: mailConfig.secure,
    auth: {
      type: mailConfig.type,
      user: mailConfig.user,
      accessToken: accessToken
    },
  }
}

const getUserPasswordTransporterOptions = async (mailConfig) => {
  return {
    host: mailConfig.host,
    port: mailConfig.port,
    secure: mailConfig.secure,
    auth: {
      type: mailConfig.type,
      user: mailConfig.user,
      pass: mailConfig.password
    },
  }
}

const sendTransporterMail = (transporter, mailOptions) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        reject(error)
      } else {
        resolve(true)
      }
    });
  })
}

exports = async function ({ from, to, subject, html, account = 'tech_account' }) {
  try {
    const nodemailer = require("nodemailer")
    const mailConfig = context.values.get("mail_config");
    const accounts = {
      tech_account: getGoogleTransporterOptions,
      noreply_account: getUserPasswordTransporterOptions
    }

    if(!mailConfig[account]) throw new Error(`La cuenta ${account} no se encuentra configurada`)
    if(!accounts[account]) throw new Error(`La cuenta ${account} no se encuentra configurada`)

    const currentMailConf = mailConfig[account]
    const transporterOptions = await accounts[account](currentMailConf)

    const transporter = nodemailer.createTransport(transporterOptions);

    const mailOptions = {
      from: from || currentMailConf.user,
      to,
      subject,
      html,
    };

    const sended = await sendTransporterMail(transporter, mailOptions)

    return sended
  } catch (error) {
    console.log(error)
    return false
  }
}