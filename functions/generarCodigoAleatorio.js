exports = function (length = 6) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
  let codigo = "";
  for (let i = 0; i < length; i++) {
    const randomNumber = Math.floor(Math.random() * alphabet.length);
    codigo += alphabet.substring(randomNumber, randomNumber + 1);
  }

  return codigo
};
