exports = function(data, hideValidate = false){
    if (data._id) {
        data._id = BSON.ObjectId(data._id);
    }
    if(data.postulante) {
        data.postulante = BSON.ObjectId(data.postulante)
    }
    if (data.nombre_propuesta) {
        data.nombre_propuesta = data.nombre_propuesta.toString();
    }  else {
        if(!hideValidate)
            throw new Error("El nombre de la propuesta es obligatorio");
    }
    if (data.gerente) {
        data.gerente = data.gerente.toString();
    } else {
        if(!hideValidate)
            throw new Error("El gerente es obligatorio");
    }
    if (data.pais) {
        if (data.pais._id) {
            data.pais._id = BSON.ObjectId(data.pais._id);
        }
        if (data.pais.nombre) {
            data.pais.nombre = data.pais.nombre.toString();
        }
        if (data.pais.codigo) {
            data.pais.codigo = data.pais.codigo.toString();
        }
        if (data.pais.codigoTelefono) {
            data.pais.codigoTelefono = data.pais.codigoTelefono.toString();
        }
    } else {
        if(!hideValidate)
            throw new Error("El país es obligatorio");
    }
    if (data.nombre_cliente) {
        data.nombre_cliente = data.nombre_cliente.toString();
    } else {
        if(!hideValidate)
            throw new Error("El nombre del cliente es obligatorio");
    }
    if (data.nombre_contraparte) {
        data.nombre_contraparte = data.nombre_contraparte.toString();
    }
    if (data.correo_contraparte) {
        data.correo_contraparte = data.correo_contraparte.toString();
    }
    if (data.telefono) {
        data.telefono = data.telefono.toString();
    }
    if (data.observaciones) {
        data.observaciones = data.observaciones.toString();
    }
    if (data.conceptos) {
        for (let i = 0; i < data.conceptos.length; i++) {
            const concepto = data.conceptos[i];
            if (concepto.nivel) {
                data.conceptos[i].nivel = parseInt(data.conceptos[i].nivel);
            }
            if (concepto.conocimiento) {
                if (concepto.conocimiento._id) {
                    data.conceptos[i].conocimiento._id = BSON.ObjectId(data.conceptos[i].conocimiento._id);
                }
                if (concepto.conocimiento.nombre) {
                    data.conceptos[i].conocimiento.nombre = data.conceptos[i].conocimiento.nombre.toString();
                }
                if (concepto.conocimiento.icon) {
                    data.conceptos[i].conocimiento.icon = data.conceptos[i].conocimiento.icon.toString();
                }
                if (concepto.conocimiento.color) {
                    data.conceptos[i].conocimiento.color = data.conceptos[i].conocimiento.color.toString();
                }
                if (concepto.conocimiento.tipo) {
                    data.conceptos[i].conocimiento.tipo._id = BSON.ObjectId(data.conceptos[i].conocimiento.tipo._id);
                    if(concepto.conocimiento.tipo.nombre) {
                      data.conceptos[i].conocimiento.tipo.nombre = data.conceptos[i].conocimiento.tipo.nombre.toString(); 
                    }
                }
            }
        }
    } else {
        data.conceptos = [];
    }
    
    if (data.estatus) {
        if (data.estatus._id) {
            data.estatus._id = BSON.ObjectId(data.estatus._id);
        }
        if (data.estatus.estado) {
            data.estatus.estado = parseInt(data.estatus.estado);
        }
        if (data.estatus.descripcion) {
            data.estatus.descripcion = data.estatus.descripcion.toString();
        }
    }

    if(data.creadorId) {
        data.creadorId = BSON.ObjectId(data.creadorId)
    }
    return data;
};