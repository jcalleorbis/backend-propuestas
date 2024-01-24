exports = async function (request, response) {
  try {
    const { query, headers, body } = request;
    // middleware para validar clientID y Origin
    await context.functions.execute(
      "middlewareVerificarOrigenClientId",
      request,
      response
    );
    // middleware validación token
    await context.functions.execute(
      "middlewareVerificarToken",
      headers,
      response
    );

    const data = validate(query);
    const queryEmpresa = context.functions.execute(
      "obtenerFiltroEmpresa",
      request
    );

    // Si se tiene filtro de empresa se filtra por postulante-empresa, sino por postulantes
    const collectionName = queryEmpresa ? "propuestas" : "propuestas"; 
    const collectionPostulantes = context.functions.execute(
      "getCollectionInstance",
      collectionName
    );

    const filterSearch = data.search.replace("+", "").trim();
    const arrMatch = nombreCompleto(filterSearch);
    const find = {
      $match: {
        $and: [
          {
            $or: [
              {
                "conceptos.conocimiento.nombre": {
                  $regex: filterSearch,
                  $options: "i",
                },
              },
              {
                telefono: { $regex: filterSearch, $options: "i" },
              },
              {
                "pais.nombre": { $regex: filterSearch, $options: "i" },
              },
              {
                "estatus.descripcion": { $regex: filterSearch, $options: "i" },
              },
            ],
          },
        ],
      },
    };
    find.$match.$and[0].$or = find.$match.$and[0].$or.concat(arrMatch);

    if (data.creadorId) {
      // filtro de creador
      find.$match.$and.push({
        creadorId: BSON.ObjectId(data.creadorId),
      });
    }

    if (queryEmpresa) {
      find.$match.$and.push(queryEmpresa);
    }

    if (data.conocimiento) {
      const conocimientos = data.conocimiento.split(",");
      for (const element of conocimientos) {
        const conocimientoFilterOrArr = [];
        const data = element.split("-");
        const querySkills = {
          conceptos: {
            $elemMatch: {
              "conocimiento._id": BSON.ObjectId(data[0]),
            },
          },
        };

        if (data.length > 1) {
          // skills por rango
          const [conocimientoId, min, max] = data;
          querySkills.conceptos.$elemMatch.nivel = data[2]
            ? { $gte: parseInt(min), $lte: parseInt(max) }
            : parseInt(min);

          if (min == 0 || max == 0) {
            // considerar nulls en casos de que se quiera buscar por nivel 0
            conocimientoFilterOrArr.push({
              conceptos: {
                $elemMatch: {
                  "conocimiento._id": BSON.ObjectId(conocimientoId),
                  nivel: null,
                },
              },
            });
          }
        }

        conocimientoFilterOrArr.push(querySkills);
        find.$match.$and.push({ $or: conocimientoFilterOrArr });
      }
    }
    
    if (data.salario) {
      const salarioObject = [];
      const salario = data.salario.split(",");
      for (let i = 0; i < salario.length; i++) {
        const element = salario[i];
        const data = element.split("-");
        salarioObject.push({
          salario: {
            $gte: parseInt(data[0]),
            $lte: parseInt(data[1]),
          },
        });
      }
      find.$match.$and = find.$match.$and.concat(salarioObject);
    }
    if (data.pais) {
      find.$match.$and.push({
        "pais._id": BSON.ObjectId(data.pais),
      });
    }
    const tieneCV =
      data.tieneCV === "true" ? true : data.tieneCV === "false" ? false : "";
    if (tieneCV === true) {
      find.$match.$and.push({
        cv: { $nin: [null, ""] },
      });
    } else if (tieneCV === false) {
      find.$match.$and.push({
        cv: {
          $not: {
            $regex: "/",
            $options: "i",
          },
        },
      });
    }
    const deleted = {
      deleted: {
        $ne: true,
      },
    };
    find.$match.$and.push(deleted);
    const postulantes = await collectionPostulantes
      .aggregate([
        find,
        {
          $skip: data.limit * (data.page - 1),
        },
        {
          $limit: data.limit,
        },
      ])
      .toArray();
    const totalData = await collectionPostulantes
      .aggregate([
        find,
        {
          $group: { _id: null, count: { $sum: 1 } },
        },
      ])
      .toArray();

    const totalDataCount = totalData[0] ? totalData[0].count : 0;
    const pagination = context.functions.execute(
      "handlerPagination",
      data.page,
      data.limit,
      postulantes,
      totalDataCount,
      find
    );
    context.functions.execute("handlerResponse", response, pagination);
  } catch (err) {
    context.functions.execute(
      "handlerResponse",
      response,
      null,
      400,
      false,
      err.message
    );
  }
};

function nombreCompleto(filterSearch) {
  const arrSearch = filterSearch.split(" ");
  const arrMatch = [];
  // cuando tiene 1 palabra
  arrSearch.forEach((searchData) => {
    arrMatch.push({
      nombre: { $regex: searchData, $options: "i" },
    });
    arrMatch.push({
      "cliente.nombre": { $regex: searchData, $options: "i" },
    });
  });
  return arrMatch;
}

function validate({
  page = 1,
  limit = 10,
  search = "",
  pais,
  conocimiento,
  idioma,
  estado,
  tieneCV,
  salario,
  ciudad,
  creadorId,
}) {
  const parsePage = parseInt(page);
  const parseLimit = parseInt(limit);

  const finalPage = isNaN(parsePage) ? 1 : parsePage;
  const finalLimit = isNaN(parseLimit) ? 10 : parseLimit;

  return {
    search,
    page: finalPage,
    limit: finalLimit,
    pais,
    conocimiento,
    idioma,
    estado,
    tieneCV,
    salario,
    ciudad,
    creadorId,
  };
}
