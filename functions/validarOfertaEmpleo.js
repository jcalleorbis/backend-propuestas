exports = async function (ofertaEmpleo) {
  const slugify = require("slugify");
  const moment = require("moment")

  if (!ofertaEmpleo.titulo)
    throw new Error("El título de postulación es requerido");
  if (!ofertaEmpleo.empresa)
    throw new Error("El ID de la empresa es requerido");
  if (!ofertaEmpleo.nivelPerfil)
    throw new Error("El nivel de perfil es requerido");
  if (!ofertaEmpleo.modalidadEmpleo)
    throw new Error("La modalidad es requerida");
  if (!ofertaEmpleo.categoriaEmpleo)
    throw new Error("La Categoría de Empleo es requerida");
  if (!ofertaEmpleo.descripcion)
    throw new Error("La descripción del Empleo es requerido");
    
  const empresaId = BSON.ObjectId(ofertaEmpleo.empresa)
  const empresa = await context.functions.execute(
    "obtenerDocumentoPorQuery",
    {
      query: { _id: empresaId, deleted: { $ne: true } },
      collectionName: "empresas",
    }
  );

  if(!empresa) throw new Error("La empresa no existe o ha sido eliminada")

  const sku = slugify(`${ofertaEmpleo.titulo}-${empresa.sku}`, {
    lower: true,
    trim: true,
  });

  const queryExiste = {
    sku: sku,
    empresa: empresaId,
    finalizado: { $ne: true },
    deleted: { $ne: true }
  }

  if(ofertaEmpleo._id) {
    queryExiste._id = { $ne: BSON.ObjectId(ofertaEmpleo._id) }
  }

  const existe = await context.functions.execute("obtenerDocumentoPorQuery", {
    query: queryExiste,
    collectionName: 'ofertas-empleo'
  })

  if(existe) throw new Error("Tienes una oferta de empleo con el mismo título que se encuentra actualmente en proceso. Finaliza o Elimina la Oferta pasada para poder crear una nueva con los mismos datos.")

  if(ofertaEmpleo.tags) {
    ofertaEmpleo.tags = ofertaEmpleo.tags?.map(tag => ({
      ...tag,
      _id: BSON.ObjectId(tag._id)
    }))
  }

  if(ofertaEmpleo.paisMoneda) {
    ofertaEmpleo.paisMoneda = {
      ...ofertaEmpleo.paisMoneda,
      _id: BSON.ObjectId(ofertaEmpleo.paisMoneda?._id)
    }
  }

  if(ofertaEmpleo.paisMonedaDefecto) {
    ofertaEmpleo.paisMonedaDefecto = {
      ...ofertaEmpleo.paisMonedaDefecto,
      _id: BSON.ObjectId(ofertaEmpleo.paisMonedaDefecto?._id)
    }
  }

  if(ofertaEmpleo.idiomas) {
    ofertaEmpleo.idiomas = ofertaEmpleo.idiomas
      ?.filter(idiomaNvl => idiomaNvl?.idioma)
      ?.map(idiomaNvl => {
        const currentIdioma = idiomaNvl?.idioma
        return {
          ...idiomaNvl,
          nivel: Number(idiomaNvl.nivel || 0),
          idioma: {
            ...(currentIdioma),
            _id: BSON.ObjectId(currentIdioma?._id)
          }
        }
      })
  }

  if(ofertaEmpleo.tecnologias) {
    ofertaEmpleo.tecnologias = ofertaEmpleo.tecnologias?.map(skill => ({
      ...skill,
      nivel: skill?.nivel ? Number(skill.nivel) : 0,
      conocimiento: {
        ...skill.conocimiento,
        _id: BSON.ObjectId(skill.conocimiento._id)
      }
    }))
  }

  if(ofertaEmpleo.modalidadEmpleo) {
    ofertaEmpleo.modalidadEmpleo = {
      ...ofertaEmpleo.modalidadEmpleo,
      _id: BSON.ObjectId(ofertaEmpleo.modalidadEmpleo?._id)
    }
  }

  if(ofertaEmpleo.nivelPerfil) {
    ofertaEmpleo.nivelPerfil = {
      ...ofertaEmpleo.nivelPerfil,
      _id: BSON.ObjectId(ofertaEmpleo.nivelPerfil?._id)
    }
  }

  if(ofertaEmpleo.pais) {
    ofertaEmpleo.pais = {
      ...ofertaEmpleo.pais,
      _id: BSON.ObjectId(ofertaEmpleo.pais?._id)
    }
  }

  return {
    titulo: ofertaEmpleo.titulo,
    empresa: empresaId,
    sku: sku,
    nivelPerfil: ofertaEmpleo.nivelPerfil,
    modalidadEmpleo: ofertaEmpleo.modalidadEmpleo,
    categoriaEmpleo: ofertaEmpleo.categoriaEmpleo,
    descripcion: ofertaEmpleo.descripcion,
    pais: ofertaEmpleo.pais || null,
    residirPais: ofertaEmpleo.residirPais || false,
    secciones: ofertaEmpleo.secciones || [],
    finalizado: ofertaEmpleo.finalizado || false,
    fechaFinalizacion: ofertaEmpleo.finalizado ? moment().toDate()  : null,
    tags: ofertaEmpleo.tags || [],
    tecnologias: ofertaEmpleo.tecnologias || [],
    habilitado: ofertaEmpleo.habilitado || false,
    idiomas: ofertaEmpleo.idiomas || [],
    paisMoneda: ofertaEmpleo.paisMoneda || null,
    rangoSalarialInicio: ofertaEmpleo.rangoSalarialInicio || '',
    rangoSalarialFin: ofertaEmpleo.rangoSalarialFin || '',
    paisMonedaDefecto: ofertaEmpleo.paisMonedaDefecto || null,
    rangoSalarialInicioDefecto: ofertaEmpleo.rangoSalarialInicioDefecto || '',
    rangoSalarialFinDefecto: ofertaEmpleo.rangoSalarialFinDefecto || '',
    esFreelance: ofertaEmpleo.esFreelance || false,
  };
};
