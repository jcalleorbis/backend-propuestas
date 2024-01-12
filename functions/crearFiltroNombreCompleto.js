exports = function nombreCompleto(filterSearch) {
  const arrSearch = filterSearch.split(" ");
  const arrMatch = [];
  // cuando tiene 1 palabra
  if (arrSearch.length === 1) {
    arrSearch.forEach((searchData) => {
      arrMatch.push({
        nombres: { $regex: searchData, $options: "i" },
      });
      arrMatch.push({
        apellidoPaterno: { $regex: searchData, $options: "i" },
      });
      arrMatch.push({
        apellidoMaterno: { $regex: searchData, $options: "i" },
      });
    });
  }

  // cuando tiene 2 palabras
  if (arrSearch.length === 2) {
    arrMatch.push({
      nombres: { $regex: arrSearch.join(" "), $options: "i" },
    });
    arrMatch.push({
      $and: [
        {
          nombres: { $regex: arrSearch[0], $options: "i" },
        },
        {
          apellidoPaterno: { $regex: arrSearch[1], $options: "i" },
        },
      ],
    });
    arrMatch.push({
      $and: [
        {
          apellidoPaterno: { $regex: arrSearch[0], $options: "i" },
        },
        {
          apellidoMaterno: { $regex: arrSearch[1], $options: "i" },
        },
      ],
    });
    arrMatch.push({
      $and: [
        {
          nombres: { $regex: arrSearch[0], $options: "i" },
        },
        {
          apellidoMaterno: { $regex: arrSearch[1], $options: "i" },
        },
      ],
    });
  }

  // cuando tiene 3 palabras
  if (arrSearch.length === 3) {
    arrMatch.push({
      nombres: { $regex: arrSearch.join(" "), $options: "i" },
    });
    arrMatch.push({
      $and: [
        {
          nombres: { $regex: arrSearch[0], $options: "i" },
        },
        {
          apellidoPaterno: { $regex: arrSearch[1], $options: "i" },
        },
        {
          apellidoMaterno: { $regex: arrSearch[2], $options: "i" },
        },
      ],
    });
    arrMatch.push({
      $and: [
        {
          nombres: { $regex: arrSearch[1], $options: "i" },
        },
        {
          apellidoPaterno: { $regex: arrSearch[0], $options: "i" },
        },
        {
          apellidoMaterno: { $regex: arrSearch[2], $options: "i" },
        },
      ],
    });
    arrMatch.push({
      $and: [
        {
          nombres: { $regex: arrSearch[2], $options: "i" },
        },
        {
          apellidoPaterno: { $regex: arrSearch[1], $options: "i" },
        },
        {
          apellidoMaterno: { $regex: arrSearch[0], $options: "i" },
        },
      ],
    });
  }
  // cuando tiene 4 palabras
  if (arrSearch.length === 4) {
    arrMatch.push({
      nombres: { $regex: arrSearch.join(" "), $options: "i" },
    });
    arrMatch.push({
      $and: [
        {
          nombres: { $regex: `${arrSearch[0]} ${arrSearch[1]}`, $options: "i" },
        },
        {
          apellidoPaterno: { $regex: arrSearch[2], $options: "i" },
        },
        {
          apellidoMaterno: { $regex: arrSearch[3], $options: "i" },
        },
      ],
    });
  }
  return arrMatch;
};
