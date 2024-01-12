exports = async (request, response) => {
  try {
    await context.functions.execute(
      "middlewareVerificarOrigenClientId",
      request,
      response
    );
    await context.functions.execute(
      "middlewareVerificarToken",
      request.headers,
      response
    );

    const { query, limit, page, vista } = formatQuerySearch(request);

    const collectionOfertasEmpleo = context.functions.execute(
      "getCollectionInstance",
      "ofertas-empleo"
    );

    const agregateOptions = [
      query,
      {
        $skip: limit * (page - 1),
      },
      {
        $limit: limit,
      },
    ];

    if (vista == "candidato") {
      // remover campos para vista de candidatos
      agregateOptions.push({
        $project: { tecnologias: 0 },
      });
    }

    const ofertasEmpleo = await collectionOfertasEmpleo
      .aggregate(agregateOptions)
      .toArray();

    const ofertasEmpleoPobladas = await context.functions.execute(
      "populateDocuments",
      {
        results: ofertasEmpleo,
        populateList: [{ ref: "empresa", collection: "empresas" }],
      }
    );

    const totalData = await collectionOfertasEmpleo
      .aggregate([
        query,
        {
          $group: { _id: null, count: { $sum: 1 } },
        },
      ])
      .toArray();

    const totalDataCount = totalData[0] ? totalData[0].count : 0;
    const pagination = context.functions.execute(
      "handlerPagination",
      page,
      limit,
      ofertasEmpleoPobladas,
      totalDataCount,
      query
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

const formatQuerySearch = (request) => {
  const params = { ...request.query };
  const jwtConfig = context.values.get("jwt_config");
  const sessionUser = request.headers?.[jwtConfig.headerUser];

  let {
    search = "",
    page = 1,
    limit = 10,
    vista = "candidato",
    empresa = "",
    tags = "",
    ocultarFinalizados = false
  } = params;

  const query = {
    $match: {
      $and: [
        {
          deleted: { $ne: true },
        },
      ],
    },
  };

  if (search) {
    const arrSearch = search?.trim()?.split(" ");
    const filterSearch = arrSearch.map((searchStr) => {
      return {
        titulo: { $regex: searchStr, $options: "i" },
      };
    });
    query.$match.$and.push({
      $or: filterSearch,
    });
  }

  if (empresa) {
    query.$match.$and.push({
      empresa: BSON.ObjectId(empresa),
    });
    limit = 1000;
  }

  if (tags) {
    const orArray = [];
    let skillsId = tags.split(",");
    skillsId?.forEach((sk) => {
      const skillId = BSON.ObjectId(sk);
      orArray.push({
        tags: {
          $elemMatch: {
            "_id": skillId,
          },
        },
      });
    });

    query.$match.$and.push({
      $or: orArray,
    });
  }

  if(ocultarFinalizados) {
    query.$match.$and.push({
      finalizado: { $ne: true }
    });
  }

  if (sessionUser.empresa || params.empresa) {
    query.$match.$and.push({
      empresa: BSON.ObjectId(params.empresa || sessionUser.empresa),
    });
  }

  // añadir más filtros

  const parsePage = parseInt(page);
  const parseLimit = parseInt(limit);

  const finalPage = isNaN(parsePage) ? 1 : parsePage;
  const finalLimit = isNaN(parseLimit) ? 10 : parseLimit;

  return {
    limit: finalLimit,
    page: finalPage,
    query: query,
    vista,
  };
};
