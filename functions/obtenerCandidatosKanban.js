exports = async function (request, response) {
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

    const { countPipeline, selectPipeline, filters } = validate(request);

    const collectionPostulaciones = context.functions.execute(
      "getCollectionInstance",
      "postulaciones"
    );

    if(!filters.conteo) { // Busca y cuenta por estado
      const postulaciones = await collectionPostulaciones
        .aggregate(selectPipeline)
        .toArray();
  
      const totalData = await collectionPostulaciones
        .aggregate(countPipeline)
        .toArray();
  
      const totalDataCount = totalData[0] ? totalData[0].count : 0;
  
      const pagination = context.functions.execute(
        "handlerPagination",
        filters.page,
        filters.limit,
        postulaciones,
        totalDataCount,
        { selectPipeline, countPipeline }
      );
  
      context.functions.execute("handlerResponse", response, pagination);
    } else { // Cuenta todos los usuarios de todos los estados

      const totalData = await collectionPostulaciones
        .aggregate(countPipeline)
        .toArray();
  
      const totalDataCount = totalData[0] ? totalData[0].count : 0;

      context.functions.execute("handlerResponse", response, totalDataCount);
    }
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

const validate = (request) => {
  
  let { search, page = 1, limit = 10, estado, oferta, conteo = false } = request.query;

  page = parseInt(page)
  limit = parseInt(limit)

  const globalMatch = {
    $and: [],
  };

  const postulantePipeline = [];

  if(oferta) {
    globalMatch.$and.push({ "oferta": BSON.ObjectId(oferta) });
  }

  if (estado) {
    // Si hay estado
    globalMatch.$and.push({ "estatus._id": BSON.ObjectId(estado) });
  } else {
    // Si no hay estado
    !conteo && globalMatch.$and.push({ "estatus._id": null });
  }

  if (search) {
    // Si hay para buscar
    postulantePipeline.push({
      $match: {
        $and: [
          {
            $or: context.functions.execute("crearFiltroNombreCompleto", search),
          },
        ],
      },
    });
  }

  const pipeline = [
    {
      $lookup: {
        from: "postulante-empresa",
        localField: "postulanteEmpresa",
        foreignField: "_id",
        as: "postulanteEmpresa",
        pipeline: postulantePipeline,
      }
    },
    {
      $lookup: {
        from: "empresas",
        localField: "empresa",
        foreignField: "_id",
        as: "empresaDoc",
      }
    },
    {
      $lookup: {
        from: "ofertas-empleo",
        localField: "oferta",
        foreignField: "_id",
        as: "ofertaDoc",
      }
    },
    {
      $unwind: "$postulanteEmpresa",
    },
    {
      $unwind: "$empresaDoc",
    },
    {
      $unwind: "$ofertaDoc",
    },
    {
      $project: {
        "postulanteEmpresa.skills": 0,
        "postulanteEmpresa.idiomas": 0,
      },
    },
  ];

  if(globalMatch.$and.length > 0) {
    pipeline.push({ $match: globalMatch })
  }

  const selectPipeline = [
    ...pipeline,
    {
      $skip: limit * (page - 1),
    },
    {
      $limit: limit,
    },
  ];

  const countPipeline = [
    ...pipeline,
    {
      $group: { _id: null, count: { $sum: 1 } },
    },
  ];

  return {
    selectPipeline,
    countPipeline,
    filters: {
      page,
      limit,
      conteo
    },
  };
};
