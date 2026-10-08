const CONTROL_FISCAL_SCRIPT_VERSION = "57";
const HOJA_COMPRAS = "Compras";
const HOJA_FACTURACION = "Facturación";

const CARPETA_RAIZ = "Control Fiscal";
const CARPETA_FACTURAS = "Facturas de compra";
const CARPETA_FACTURAS_EMITIDAS = "Facturas emitidas";
const COLUMNA_TIENDA = 2;      // B de Compras
const COLUMNA_PROVEEDOR = 2;   // B de Compras
const HOJA_LISTAS = "Listas";
const HOJA_CONFIG = "Configuracion";
const HOJA_INVENTARIO = "Inventario";
const HOJA_AGENDA = "Agenda";
const HOJA_INGRESOS_INDEPENDIENTES = "Ingresos independientes";
const HOJA_INGRESOS_LEGACY = "Ingresos pendientes";


/* =========================================================
   GET
   ========================================================= */

function doGet(e) {

  try {

    const p =
      (e && e.parameter)
        ? e.parameter
        : {};


    // Operaciones mediante JSONP
    if (
      p.accion === "editar" ||
      p.accion === "eliminar" ||
      p.accion === "enviarFacturas" ||
      p.accion === "listarTerceros" ||
      p.accion === "guardarTercero" ||
      p.accion === "eliminarTercero" ||
      p.accion === "obtenerConfiguracion" ||
      p.accion === "guardarConfiguracion" ||
      p.accion === "crearFactura" ||
      p.accion === "listarClientes" ||
      p.accion === "guardarCliente" ||
      p.accion === "eliminarCliente" ||
      p.accion === "listarInventario" ||
      p.accion === "guardarInventario" ||
      p.accion === "eliminarInventario" ||
      p.accion === "listarAgenda" ||
      p.accion === "guardarEvento" ||
      p.accion === "eliminarEvento" ||
      p.accion === "listarIngresosPendientes" ||
      p.accion === "guardarIngresoPendiente" ||
      p.accion === "eliminarIngresoPendiente" ||
      p.accion === "version"
    ) {

      const resultado =
        ejecutarOperacion(p);

      const callback =
        p.callback;


      if (callback) {

        return ContentService
          .createTextOutput(
            callback +
            "(" +
            resultado.getContent() +
            ")"
          )
          .setMimeType(
            ContentService.MimeType.JAVASCRIPT
          );

      }


      return resultado;

    }


    const ss =
      SpreadsheetApp
        .getActiveSpreadsheet();


    const resultado = {

      ok: true,

      compras:
        leerCompras(ss),

      facturacion:
        leerFacturacion(ss)

    };


    if (p.callback) {

      return ContentService
        .createTextOutput(
          p.callback +
          "(" +
          JSON.stringify(resultado) +
          ")"
        )
        .setMimeType(
          ContentService.MimeType.JAVASCRIPT
        );

    }


    if (p.accion) {
      return respuesta({
        ok: false,
        error: "Acción no soportada: " + p.accion + ". Actualiza Apps Script a la V56."
      });
    }

    return respuesta(resultado);


  } catch (error) {

    const resultado = {

      ok: false,

      error:
        error.message

    };


    if (
      e &&
      e.parameter &&
      e.parameter.callback
    ) {

      return ContentService
        .createTextOutput(
          e.parameter.callback +
          "(" +
          JSON.stringify(resultado) +
          ")"
        )
        .setMimeType(
          ContentService.MimeType.JAVASCRIPT
        );

    }


    return respuesta(resultado);

  }

}


/* =========================================================
   POST
   ========================================================= */

function doPost(e) {

  try {

    const datos =
      JSON.parse(
        e.postData.contents
      );


    return ejecutarOperacion(datos);


  } catch (error) {

    return respuesta({

      ok: false,

      error:
        error.message

    });

  }

}


/* =========================================================
   EJECUTAR OPERACIÓN
   ========================================================= */

function ejecutarOperacion(datos) {

  try {

    const ss =
      SpreadsheetApp
        .getActiveSpreadsheet();


    let resultadoOperacion = {};


    /* =========================
       EDITAR
       ========================= */


    if (datos.accion === "version") {

      return respuesta({ok:true,version:CONTROL_FISCAL_SCRIPT_VERSION,mensaje:"Apps Script V56 activo."});

    } else if (datos.accion === "listarTerceros") {

      const listas = leerListas(ss);

      return respuesta({
        ok: true,
        tiendas: listas.tiendas,
        proveedores: listas.proveedores
      });

    } else if (datos.accion === "guardarTercero") {

      return respuesta(guardarTercero(ss, datos));

    } else if (datos.accion === "eliminarTercero") {

      return respuesta(eliminarTercero(ss, datos));

    } else if (datos.accion === "obtenerConfiguracion") {

      return respuesta({
        ok: true,
        configuracion: leerConfiguracion(ss)
      });

    } else if (datos.accion === "guardarConfiguracion") {

      return respuesta(guardarConfiguracion(ss, datos));

    } else if (datos.accion === "crearFactura") {

      return respuesta(guardarFacturaCompleta(ss, datos));

    } else if (datos.accion === "listarClientes") {

      return respuesta(listarClientes(ss));

    } else if (datos.accion === "guardarCliente") {

      return respuesta(guardarCliente(ss, datos));

    } else if (datos.accion === "eliminarCliente") {

      return respuesta(eliminarCliente(ss, datos));

    } else if (datos.accion === "listarInventario") {

      return respuesta({ok:true, items:leerInventario(ss)});

    } else if (datos.accion === "guardarInventario") {

      return respuesta(guardarInventario(ss, datos));

    } else if (datos.accion === "eliminarInventario") {

      return respuesta(eliminarInventario(ss, datos));

    } else if (datos.accion === "listarAgenda") {

      return respuesta({ok:true, eventos:leerAgenda(ss)});

    } else if (datos.accion === "guardarEvento") {

      return respuesta(guardarEvento(ss, datos));

    } else if (datos.accion === "eliminarEvento") {

      return respuesta(eliminarEvento(ss, datos));

    } else if (datos.accion === "listarIngresosPendientes") {

      return respuesta({ok:true, ingresos:leerIngresosPendientes(ss)});

    } else if (datos.accion === "guardarIngresoPendiente") {

      return respuesta(guardarIngresoPendiente(ss, datos));

    } else if (datos.accion === "eliminarIngresoPendiente") {

      return respuesta(eliminarIngresoPendiente(ss, datos));

    } else if (datos.accion === "editar") {

      editarRegistro(
        ss,
        datos
      );


    /* =========================
       ELIMINAR
       ========================= */

    } else if (
      datos.accion === "eliminar"
    ) {

      eliminarRegistro(
        ss,
        datos
      );


    /* =========================
       ENVIAR FACTURAS
       ========================= */

    } else if (
      datos.accion === "enviarFacturas"
    ) {

      resultadoOperacion =
        enviarFacturasPorCorreo(
          ss,
          datos
        );


    /* =========================
       COMPRA
       ========================= */

    } else if (
      datos.tipo === "Compra"
    ) {

      guardarCompra(
        ss,
        datos
      );


    /* =========================
       FACTURACIÓN
       ========================= */

    } else if (
      datos.tipo === "Facturado" ||
      datos.tipo === "Facturación"
    ) {

      guardarFacturacion(
        ss,
        datos
      );


    } else {

      throw new Error(
        "Tipo de registro no válido"
      );

    }


    return respuesta({

      ok: true,

      mensaje:
        "Operación realizada correctamente",

      ...resultadoOperacion

    });


  } catch (error) {

    return respuesta({

      ok: false,

      error:
        error.message

    });

  }

}


/* =========================================================
   COMPRAS
   ========================================================= */

function guardarCompra(
  ss,
  datos
) {

  const hoja =
    ss.getSheetByName(
      HOJA_COMPRAS
    );


  if (!hoja) {

    throw new Error(
      "No existe la hoja Compras"
    );

  }


  const total =
    Number(datos.total) || 0;


  const porcentajeIVA =
    Number(
      datos.ivaPorcentaje
    ) || 0;


  if (total <= 0) {

    throw new Error(
      "El total de la compra debe ser mayor que 0"
    );

  }


  let base;
  let iva;


  /*
   * COMPRAS
   *
   * El importe introducido
   * incluye IVA.
   */

  if (porcentajeIVA > 0) {

    base =
      total /
      (
        1 +
        porcentajeIVA / 100
      );


    iva =
      total - base;


  } else {

    base =
      total;

    iva =
      0;

  }


  let facturaUrl = "";


  if (
    datos.archivoBase64
  ) {

    facturaUrl =
      guardarFacturaDrive(
        datos
      );

  }


  /*
   * Asegurar columna H
   */

  if (
    hoja
      .getRange(1, 8)
      .getValue() === ""
  ) {

    hoja
      .getRange(1, 8)
      .setValue("Factura");

  }


  hoja.appendRow([

    new Date(),

    datos.tercero || "",

    datos.concepto || "",

    redondear(base),

    porcentajeIVA,

    redondear(iva),

    redondear(total),

    facturaUrl

  ]);

}


/* =========================================================
   GUARDAR FACTURA DE COMPRA EN DRIVE
   ========================================================= */

function guardarFacturaDrive(
  datos
) {

  if (
    !datos.archivoBase64
  ) {

    return "";

  }


  const bytes =
    Utilities.base64Decode(
      datos.archivoBase64
    );


  const mime =
    datos.archivoMime ||
    "application/octet-stream";


  const nombreOriginal =
    datos.archivoNombre ||
    "factura";


  const nombreSeguro =
    limpiarNombreArchivo(
      nombreOriginal
    );


  const carpeta =
    obtenerCarpetaFacturas();


  const ahora =
    new Date();


  const marcaTiempo =
    Utilities.formatDate(
      ahora,
      Session.getScriptTimeZone(),
      "yyyyMMdd_HHmmss"
    );


  const nombreFinal =
    marcaTiempo +
    "_" +
    nombreSeguro;


  const blob =
    Utilities.newBlob(
      bytes,
      mime,
      nombreFinal
    );


  const archivo =
    carpeta.createFile(
      blob
    );


  return archivo.getUrl();

}


/* =========================================================
   GUARDAR FACTURA EMITIDA EN DRIVE
   ========================================================= */

function guardarFacturaEmitidaDrive(
  datos
) {

  if (
    !datos.archivoBase64
  ) {

    return "";

  }


  const bytes =
    Utilities.base64Decode(
      datos.archivoBase64
    );


  const mime =
    datos.archivoMime ||
    "application/octet-stream";


  const nombreOriginal =
    datos.archivoNombre ||
    "factura";


  const nombreSeguro =
    limpiarNombreArchivo(
      nombreOriginal
    );


  const carpeta =
    obtenerCarpetaFacturasEmitidas();


  const ahora =
    new Date();


  const marcaTiempo =
    Utilities.formatDate(
      ahora,
      Session.getScriptTimeZone(),
      "yyyyMMdd_HHmmss"
    );


  const nombreFinal =
    marcaTiempo +
    "_" +
    nombreSeguro;


  const blob =
    Utilities.newBlob(
      bytes,
      mime,
      nombreFinal
    );


  const archivo =
    carpeta.createFile(
      blob
    );


  return archivo.getUrl();

}


/* =========================================================
   CARPETA FACTURAS DE COMPRA
   ========================================================= */

function obtenerCarpetaFacturas() {

  const año =
    Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "yyyy"
    );


  const carpetasRaiz =
    DriveApp.getFoldersByName(
      CARPETA_RAIZ
    );


  let raiz;


  if (
    carpetasRaiz.hasNext()
  ) {

    raiz =
      carpetasRaiz.next();

  } else {

    raiz =
      DriveApp.createFolder(
        CARPETA_RAIZ
      );

  }


  const carpetasFacturas =
    raiz.getFoldersByName(
      CARPETA_FACTURAS
    );


  let facturas;


  if (
    carpetasFacturas.hasNext()
  ) {

    facturas =
      carpetasFacturas.next();

  } else {

    facturas =
      raiz.createFolder(
        CARPETA_FACTURAS
      );

  }


  const carpetasAño =
    facturas.getFoldersByName(
      año
    );


  if (
    carpetasAño.hasNext()
  ) {

    return carpetasAño.next();

  }


  return facturas.createFolder(
    año
  );

}


/* =========================================================
   CARPETA FACTURAS EMITIDAS
   ========================================================= */

function obtenerCarpetaFacturasEmitidas() {

  const año =
    Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "yyyy"
    );


  const carpetasRaiz =
    DriveApp.getFoldersByName(
      CARPETA_RAIZ
    );


  let raiz;


  if (
    carpetasRaiz.hasNext()
  ) {

    raiz =
      carpetasRaiz.next();

  } else {

    raiz =
      DriveApp.createFolder(
        CARPETA_RAIZ
      );

  }


  const carpetasEmitidas =
    raiz.getFoldersByName(
      CARPETA_FACTURAS_EMITIDAS
    );


  let emitidas;


  if (
    carpetasEmitidas.hasNext()
  ) {

    emitidas =
      carpetasEmitidas.next();

  } else {

    emitidas =
      raiz.createFolder(
        CARPETA_FACTURAS_EMITIDAS
      );

  }


  const carpetasAño =
    emitidas.getFoldersByName(
      año
    );


  if (
    carpetasAño.hasNext()
  ) {

    return carpetasAño.next();

  }


  return emitidas.createFolder(
    año
  );

}


/* =========================================================
   LIMPIAR NOMBRE
   ========================================================= */

function limpiarNombreArchivo(
  nombre
) {

  return String(nombre)

    .replace(
      /[\\\/:*?"<>|]/g,
      "_"
    )

    .trim()

    .substring(
      0,
      150
    );

}


/* =========================================================
   CLIENTES GUARDADOS
   ========================================================= */

const HOJA_CLIENTES = "Clientes";

function obtenerHojaClientes(ss) {
  let hoja = ss.getSheetByName(HOJA_CLIENTES);
  if (!hoja) {
    hoja = ss.insertSheet(HOJA_CLIENTES);
    hoja.getRange(1,1,1,9).setValues([[
      "Nombre / Empresa","CIF/NIF","Dirección","CP","Ciudad","Provincia","Teléfono","Email","Activo"
    ]]);
    hoja.getRange(1,1,1,9).setFontWeight("bold");
  }
  return hoja;
}

function listarClientes(ss) {
  const hoja = obtenerHojaClientes(ss);
  const last = hoja.getLastRow();
  const clientes=[];
  if(last>=2){
    const vals=hoja.getRange(2,1,last-1,9).getValues();
    vals.forEach(r=>{
      const nombre=String(r[0]||"").trim();
      if(!nombre) return;
      if(r[8]===false || String(r[8]).toLowerCase()==="false") return;
      clientes.push({nombre,cif:String(r[1]||"").trim(),direccion:String(r[2]||"").trim(),cp:String(r[3]||"").trim(),ciudad:String(r[4]||"").trim(),provincia:String(r[5]||"").trim(),telefono:String(r[6]||"").trim(),email:String(r[7]||"").trim()});
    });
  }
  clientes.sort((a,b)=>a.nombre.localeCompare(b.nombre,"es",{sensitivity:"base"}));
  return {ok:true,clientes};
}

function guardarCliente(ss,datos){
  const cliente=parseJsonSeguro(datos.cliente,{});
  const nombre=String(cliente.nombre||"").trim();
  const cif=String(cliente.cif||"").trim();
  if(!nombre || !cif) throw new Error("Indica al menos nombre/empresa y CIF/NIF del cliente.");
  const hoja=obtenerHojaClientes(ss);
  const last=hoja.getLastRow();
  if(last>=2){
    const vals=hoja.getRange(2,1,last-1,9).getValues();
    for(let i=0;i<vals.length;i++){
      const n=String(vals[i][0]||"").trim();
      const c=String(vals[i][1]||"").trim();
      if((c && c.toLowerCase()===cif.toLowerCase()) || n.toLowerCase()===nombre.toLowerCase()){
        hoja.getRange(i+2,1,1,9).setValues([[nombre,cif,String(cliente.direccion||"").trim(),String(cliente.cp||"").trim(),String(cliente.ciudad||"").trim(),String(cliente.provincia||"").trim(),String(cliente.telefono||"").trim(),String(cliente.email||"").trim(),true]]);
        return listarClientes(ss);
      }
    }
  }
  hoja.appendRow([nombre,cif,String(cliente.direccion||"").trim(),String(cliente.cp||"").trim(),String(cliente.ciudad||"").trim(),String(cliente.provincia||"").trim(),String(cliente.telefono||"").trim(),String(cliente.email||"").trim(),true]);
  return listarClientes(ss);
}

function eliminarCliente(ss,datos){
  const nombre=String(datos.nombre||"").trim();
  const cif=String(datos.cif||"").trim();
  const hoja=obtenerHojaClientes(ss);
  const last=hoja.getLastRow();
  if(last<2) return {ok:true};
  const vals=hoja.getRange(2,1,last-1,9).getValues();
  for(let i=0;i<vals.length;i++){
    if((cif && String(vals[i][1]||"").trim().toLowerCase()===cif.toLowerCase()) || (nombre && String(vals[i][0]||"").trim().toLowerCase()===nombre.toLowerCase())){
      hoja.getRange(i+2,9).setValue(false);
      return {ok:true};
    }
  }
  return {ok:true};
}

/* =========================================================
   FACTURACIÓN
   ========================================================= */

function guardarFacturacion(
  ss,
  datos
) {

  const hoja = ss.getSheetByName(HOJA_FACTURACION);

  if (!hoja) {
    throw new Error("No existe la hoja Facturación");
  }

  const base = Number(datos.base) || 0;
  const porcentajeIVA = Number(datos.ivaPorcentaje) || 0;

  if (base <= 0) {
    throw new Error("La base de la factura debe ser mayor que 0");
  }

  const iva = base * porcentajeIVA / 100;
  const total = base + iva;

  asegurarColumnasFacturacion(hoja);

  let facturaUrl = "";
  if (datos.archivoBase64) {
    facturaUrl = guardarFacturaEmitidaDrive(datos);
  }

  hoja.appendRow([
    new Date(),
    datos.tercero || "",
    datos.concepto || "",
    redondear(base),
    porcentajeIVA,
    redondear(iva),
    redondear(total),
    facturaUrl
  ]);

  SpreadsheetApp.flush();

  return { ok: true };
}

function asegurarColumnasFacturacion(hoja) {
  const encabezados = [
    "Fecha", "Cliente", "Concepto", "Base imponible", "IVA %", "IVA", "Total", "Factura", "Nº Factura",
    "CIF/NIF cliente", "Dirección cliente", "CP cliente", "Ciudad cliente", "Provincia cliente", "Email cliente",
    "Teléfono cliente", "Emisor JSON", "Líneas JSON", "Descuento %", "Observaciones", "Clave solicitud"
  ];
  hoja.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
  hoja.getRange(1, 1, 1, encabezados.length).setFontWeight("bold");
}

function generarNumeroFactura(hoja) {
  const year = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "Europe/Madrid", "yyyy");
  const prefijo = "F" + year + "-";
  const ultimaFila = hoja.getLastRow();
  let max = 0;

  if (ultimaFila >= 2) {
    const valores = hoja.getRange(2, 9, ultimaFila - 1, 1).getValues();
    valores.forEach(fila => {
      const n = String(fila[0] || "").trim();
      if (n.indexOf(prefijo) === 0) {
        const parte = Number(n.substring(prefijo.length));
        if (isFinite(parte) && parte > max) max = parte;
      }
    });
  }

  return prefijo + String(max + 1).padStart(3, "0");
}

function guardarFacturaCompleta(ss, datos) {
  const hoja = ss.getSheetByName(HOJA_FACTURACION);
  if (!hoja) throw new Error("No existe la hoja Facturación");

  const tercero = String(datos.tercero || "").trim();
  const base = Number(datos.base) || 0;
  const ivaPorcentaje = Number(datos.ivaPorcentaje) || 0;
  const cliente = parseJsonSeguro(datos.cliente, {});
  const lineas = parseJsonSeguro(datos.lineas, []);
  const emisor = parseJsonSeguro(datos.emisor, {});
  const descuento = Number(datos.descuento) || 0;
  const observaciones = String(datos.observaciones || "").trim();
  const requestId = String(datos.requestId || "").trim();

  if (!tercero) throw new Error("Falta el nombre del cliente");
  if (!cliente.cif) throw new Error("Falta el CIF/NIF del cliente");
  if (!Array.isArray(lineas) || !lineas.length) throw new Error("La factura debe tener al menos un concepto");
  if (!isFinite(base) || base <= 0) throw new Error("La base imponible no es válida");
  if (!requestId) throw new Error("Falta la clave de solicitud. Vuelve a pulsar guardar.");

  lineas.forEach(linea => {
    const cantidad = Number(linea.cantidad) || 0;
    const precio = Number(linea.precio) || 0;
    if (!linea.concepto || cantidad <= 0 || precio < 0) {
      throw new Error("Hay un concepto con datos no válidos");
    }
  });

  asegurarColumnasFacturacion(hoja);

  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);

  try {
    // IDEMPOTENCIA: si el navegador reintenta porque agotó el tiempo,
    // devolvemos la misma factura en lugar de crear otra.
    const ultimaFila = hoja.getLastRow();
    if (ultimaFila >= 2) {
      const claves = hoja.getRange(2, 21, ultimaFila - 1, 1).getValues();
      for (let i = 0; i < claves.length; i++) {
        if (String(claves[i][0] || "").trim() === requestId) {
          const fila = i + 2;
          const numeroExistente = String(hoja.getRange(fila, 9).getValue() || "").trim();
          const urlExistente = String(hoja.getRange(fila, 8).getValue() || "").trim();
          return {
            ok: true,
            numeroFactura: numeroExistente,
            facturaUrl: urlExistente,
            repetida: true
          };
        }
      }
    }

    const numeroFactura = generarNumeroFactura(hoja);
    const iva = base * ivaPorcentaje / 100;
    const total = base + iva;

    // El PDF se genera una sola vez para esta requestId.
    const facturaUrl = generarFacturaPdfDrive({
      numeroFactura,
      tercero,
      base,
      ivaPorcentaje,
      iva,
      total,
      cliente,
      lineas,
      emisor,
      descuento,
      observaciones
    });

    hoja.appendRow([
      new Date(),
      tercero,
      datos.concepto || lineas.map(x => x.concepto).join(" · "),
      redondear(base),
      ivaPorcentaje,
      redondear(iva),
      redondear(total),
      facturaUrl,
      numeroFactura,
      cliente.cif || "",
      cliente.direccion || "",
      cliente.cp || "",
      cliente.ciudad || "",
      cliente.provincia || "",
      cliente.email || "",
      cliente.telefono || "",
      JSON.stringify(emisor),
      JSON.stringify(lineas),
      descuento,
      observaciones,
      requestId
    ]);

    SpreadsheetApp.flush();
    return { ok: true, numeroFactura: numeroFactura, facturaUrl: facturaUrl };
  } finally {
    lock.releaseLock();
  }
}


/* =========================================================
   GENERAR PDF DE FACTURA EMITIDA
   ========================================================= */

function generarFacturaPdfDrive(datos) {
  const numero = String(datos.numeroFactura || "Factura").trim();
  const cliente = datos.cliente || {};
  const emisor = datos.emisor || {};
  const lineas = Array.isArray(datos.lineas) ? datos.lineas : [];
  const base = Number(datos.base) || 0;
  const ivaPorcentaje = Number(datos.ivaPorcentaje) || 0;
  const iva = Number(datos.iva) || (base * ivaPorcentaje / 100);
  const total = Number(datos.total) || (base + iva);
  const descuento = Number(datos.descuento) || 0;
  const fecha = new Date();
  const clienteNombre = String(cliente.nombre || datos.tercero || "Cliente").trim();
  const nombreArchivo = limpiarNombreArchivo(numero + " - " + clienteNombre) + ".pdf";
  const logoBase64 = "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";

  let docId = "";
  try {
    const doc = DocumentApp.create(numero + " - " + clienteNombre);
    docId = doc.getId();
    const body = doc.getBody();
    body.clear();
    body.setMarginTop(28);
    body.setMarginBottom(28);
    body.setMarginLeft(30);
    body.setMarginRight(30);

    // CABECERA: logo a la izquierda y número/fecha a la derecha.
    const cabecera = body.appendTable([["", ""]]);
    cabecera.setBorderWidth(0);
    const celLogo = cabecera.getCell(0, 0);
    const pLogo = celLogo.getChild(0).asParagraph();
    pLogo.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
    const img = pLogo.appendInlineImage(
      Utilities.newBlob(Utilities.base64Decode(logoBase64), "image/png", "chispas-logo.png")
    );
    img.setWidth(185);
    img.setHeight(111);

    const celMeta = cabecera.getCell(0, 1);
    const pFactura = celMeta.getChild(0).asParagraph();
    pFactura.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
    pFactura.appendText("Factura: ").setBold(true);
    pFactura.appendText(numero).setBold(true);
    const pFecha = celMeta.appendParagraph("Fecha: " + Utilities.formatDate(fecha, Session.getScriptTimeZone() || "Europe/Madrid", "dd/MM/yyyy"));
    pFecha.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);

    body.appendParagraph("");

    // Título y referencia/presupuesto.
    const tituloTabla = body.appendTable([["Sonido e Iluminación Para Eventos Chispas Sound", ""]]);
    tituloTabla.setBorderWidth(0);
    const tituloCelda = tituloTabla.getCell(0, 0);
    const tituloP = tituloCelda.getChild(0).asParagraph();
    tituloP.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
    tituloP.editAsText().setBold(true).setFontSize(11);
    const refCelda = tituloTabla.getCell(0, 1);
    const refP = refCelda.getChild(0).asParagraph();
    refP.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
    const nota = String(datos.observaciones || "").trim();
    refP.appendText("Presupuesto: ").setBold(true);
    refP.appendText(nota || "-");

    body.appendParagraph("");

    // EMISOR / CLIENTE.
    const datosTabla = body.appendTable([["EMISOR", "CLIENTE"], ["", ""]]);
    try { datosTabla.setBorderColor("#555555"); datosTabla.setBorderWidth(1); } catch (_) {}
    datosTabla.getCell(0,0).setBackgroundColor("#d9d9d9");
    datosTabla.getCell(0,1).setBackgroundColor("#d9d9d9");
    datosTabla.getRow(0).editAsText().setBold(true);

    const emisorTexto = [
      emisor.name || "",
      emisor.taxId ? "CIF/NIF: " + emisor.taxId : "",
      emisor.address || "",
      [emisor.postalCode, emisor.city].filter(Boolean).join(" "),
      emisor.province || "",
      emisor.phone ? "Tel.: " + emisor.phone : "",
      emisor.email || "",
      emisor.iban ? "Nº cuenta:    " + emisor.iban : ""
    ].filter(Boolean).join("\n");
    const clienteTexto = [
      clienteNombre,
      cliente.cif ? String(cliente.cif) : "",
      cliente.direccion || "",
      [cliente.cp, cliente.ciudad].filter(Boolean).join(" "),
      cliente.provincia || "",
      cliente.telefono ? "Tel.: " + cliente.telefono : "",
      cliente.email || ""
    ].filter(Boolean).join("\n");

    datosTabla.getCell(1,0).getChild(0).asParagraph().appendText(emisorTexto).setFontSize(9);
    datosTabla.getCell(1,1).getChild(0).asParagraph().appendText(clienteTexto).setFontSize(9);

    body.appendParagraph("");
    body.appendHorizontalRule();
    body.appendParagraph("");

    // CONCEPTOS.
    const filasConceptos = [["Producto", "Precio", "cantidad", "Total"]];
    lineas.forEach(function(linea) {
      const cantidad = Number(linea.cantidad) || 0;
      const precio = Number(linea.precio) || 0;
      const totalLinea = cantidad * precio;
      filasConceptos.push([
        String(linea.concepto || ""),
        formatearEuros(precio),
        String(cantidad),
        formatearEuros(totalLinea)
      ]);
    });
    const tabla = body.appendTable(filasConceptos);
    try { tabla.setBorderColor("#555555"); tabla.setBorderWidth(1); } catch (_) {}
    tabla.getRow(0).editAsText().setBold(true);
    for (let c = 0; c < 4; c++) tabla.getCell(0,c).setBackgroundColor("#d9d9d9");
    for (let r = 1; r < tabla.getNumRows(); r++) {
      if (r % 2 === 0) {
        for (let c = 0; c < 4; c++) tabla.getCell(r,c).setBackgroundColor("#f2f2f2");
      }
      tabla.getCell(r,1).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
      tabla.getCell(r,2).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      tabla.getCell(r,3).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
    }

    body.appendParagraph("");

    // RESUMEN FINAL, siguiendo el formato de la factura de referencia.
    const resumen = body.appendTable([
      ["Base Importe", formatearEuros(base)],
      ["IVA (" + ivaPorcentaje + "%)", formatearEuros(iva)],
      ["TOTAL FACTURA", formatearEuros(total)],
      ["TOTAL A PAGAR", formatearEuros(total)]
    ]);
    resumen.setBorderWidth(0);
    resumen.getRow(2).editAsText().setBold(true);
    resumen.getRow(3).editAsText().setBold(true);
    resumen.getCell(2,0).setBackgroundColor("#eeeeee");
    resumen.getCell(2,1).setBackgroundColor("#eeeeee");
    resumen.getCell(3,0).setBackgroundColor("#eeeeee");
    resumen.getCell(3,1).setBackgroundColor("#eeeeee");
    for (let r = 0; r < resumen.getNumRows(); r++) {
      resumen.getCell(r,1).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
    }

    if (descuento > 0) {
      const pDesc = body.appendParagraph("Descuento: " + descuento.toFixed(2).replace(".", ",") + "%");
      pDesc.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
    }

    doc.saveAndClose();

    const archivoDoc = DriveApp.getFileById(docId);
    const carpeta = obtenerCarpetaFacturasEmitidas();
    const pdf = carpeta.createFile(archivoDoc.getAs(MimeType.PDF));
    pdf.setName(nombreArchivo);
    archivoDoc.setTrashed(true);

    return pdf.getUrl();
  } catch (e) {
    if (docId) {
      try { DriveApp.getFileById(docId).setTrashed(true); } catch (_) {}
    }
    throw new Error("No se pudo generar el PDF de la factura: " + e.message);
  }
}

function formatearEuros(valor) {
  const numero = Number(valor) || 0;
  return numero.toFixed(2).replace(".", ",") + " €";
}

function parseJsonSeguro(valor, fallback) {
  if (valor && typeof valor === "object") return valor;
  try {
    const resultado = JSON.parse(String(valor || ""));
    return resultado == null ? fallback : resultado;
  } catch (e) {
    return fallback;
  }
}

/* =========================================================
   EDITAR
   ========================================================= */

function editarRegistro(
  ss,
  datos
) {

  const fila =
    Number(datos.fila);


  if (
    !fila ||
    fila < 2
  ) {

    throw new Error(
      "Fila de registro no válida: " +
      datos.fila
    );

  }


  let hoja;


  if (
    datos.tipo === "Compra"
  ) {

    hoja =
      ss.getSheetByName(
        HOJA_COMPRAS
      );


  } else if (
    datos.tipo === "Facturado" ||
    datos.tipo === "Facturación"
  ) {

    hoja =
      ss.getSheetByName(
        HOJA_FACTURACION
      );


  } else {

    throw new Error(
      "Tipo de registro no válido: " +
      datos.tipo
    );

  }


  if (!hoja) {

    throw new Error(
      "No existe la hoja correspondiente"
    );

  }


  if (
    fila >
    hoja.getLastRow()
  ) {

    throw new Error(
      "La fila " +
      fila +
      " no existe en " +
      hoja.getName()
    );

  }


  const tercero =
    String(
      datos.tercero || ""
    ).trim();


  const concepto =
    String(
      datos.concepto || ""
    ).trim();


  const ivaPorcentaje =
    Number(
      datos.ivaPorcentaje
    ) || 0;


  if (!tercero) {

    throw new Error(
      "Falta el cliente/proveedor"
    );

  }


  if (!concepto) {

    throw new Error(
      "Falta el concepto"
    );

  }


  let base;
  let iva;
  let total;


  /*
   * COMPRA
   */

  if (
    datos.tipo === "Compra"
  ) {

    total =
      Number(datos.total);


    if (
      !isFinite(total) ||
      total <= 0
    ) {

      throw new Error(
        "Importe de compra no válido"
      );

    }


    if (
      ivaPorcentaje > 0
    ) {

      base =
        total /
        (
          1 +
          ivaPorcentaje / 100
        );


      iva =
        total - base;


    } else {

      base =
        total;

      iva =
        0;

    }


  /*
   * FACTURACIÓN
   */

  } else {

    base =
      Number(datos.base);


    if (
      !isFinite(base) ||
      base <= 0
    ) {

      throw new Error(
        "Base imponible no válida"
      );

    }


    iva =
      base *
      ivaPorcentaje /
      100;


    total =
      base +
      iva;

  }


  /*
   * Modificar B:G
   */

  hoja
    .getRange(
      fila,
      2,
      1,
      6
    )
    .setValues([[
      
      tercero,

      concepto,

      redondear(base),

      ivaPorcentaje,

      redondear(iva),

      redondear(total)

    ]]);


  SpreadsheetApp.flush();


  /*
   * Comprobación
   */

  const comprobacion =
    hoja
      .getRange(
        fila,
        2,
        1,
        6
      )
      .getValues()[0];


  if (
    String(
      comprobacion[0]
    ) !== tercero ||

    String(
      comprobacion[1]
    ) !== concepto
  ) {

    throw new Error(
      "Google Sheets no confirmó la modificación"
    );

  }

}


/* =========================================================
   ELIMINAR
   ========================================================= */

function eliminarRegistro(
  ss,
  datos
) {

  const fila =
    Number(datos.fila);


  if (
    !fila ||
    fila < 2
  ) {

    throw new Error(
      "Fila de registro no válida"
    );

  }


  let hoja;


  if (
    datos.tipo === "Compra"
  ) {

    hoja =
      ss.getSheetByName(
        HOJA_COMPRAS
      );


  } else if (
    datos.tipo === "Facturado" ||
    datos.tipo === "Facturación"
  ) {

    hoja =
      ss.getSheetByName(
        HOJA_FACTURACION
      );


  } else {

    throw new Error(
      "Tipo de registro no válido"
    );

  }


  if (!hoja) {

    throw new Error(
      "No existe la hoja correspondiente"
    );

  }


  if (
    fila >
    hoja.getLastRow()
  ) {

    throw new Error(
      "La fila indicada no existe"
    );

  }


  hoja.deleteRow(
    fila
  );


  SpreadsheetApp.flush();

}


/* =========================================================
   LEER COMPRAS
   ========================================================= */

function leerCompras(
  ss
) {

  const hoja =
    ss.getSheetByName(
      HOJA_COMPRAS
    );


  if (!hoja) {
    return [];
  }


  return leerFilas(
    hoja,
    "Compra"
  );

}


/* =========================================================
   LEER FACTURACIÓN
   ========================================================= */

function leerFacturacion(
  ss
) {

  const hoja =
    ss.getSheetByName(
      HOJA_FACTURACION
    );


  if (!hoja) {
    return [];
  }


  return leerFilas(
    hoja,
    "Facturado"
  );

}


/* =========================================================
   LEER FILAS
   ========================================================= */

function leerFilas(
  hoja,
  tipo
) {

  const datos =
    hoja
      .getDataRange()
      .getValues();


  if (
    datos.length <= 1
  ) {

    return [];

  }


  const registros = [];


  for (
    let i = 1;
    i < datos.length;
    i++
  ) {

    const fila =
      datos[i];


    if (
      fila.every(
        celda =>
          celda === ""
      )
    ) {

      continue;

    }


    registros.push({

      tipo:
        tipo,

      fila:
        i + 1,

      fecha:
        convertirFecha(
          fila[0]
        ),

      tercero:
        fila[1] || "",

      concepto:
        fila[2] || "",

      base:
        Number(
          fila[3]
        ) || 0,

      ivaPorcentaje:
        Number(
          fila[4]
        ) || 0,

      iva:
        Number(
          fila[5]
        ) || 0,

      total:
        Number(
          fila[6]
        ) || 0,

      facturaUrl:
        fila[7] || "",

      numeroFactura:
        fila[8] || "",

      clienteCif:
        fila[9] || "",

      clienteDireccion:
        fila[10] || "",

      clienteCp:
        fila[11] || "",

      clienteCiudad:
        fila[12] || "",

      clienteProvincia:
        fila[13] || "",

      clienteEmail:
        fila[14] || "",

      clienteTelefono:
        fila[15] || "",

      emisor:
        parseJsonSeguro(fila[16], {}),

      lineas:
        parseJsonSeguro(fila[17], []),

      descuento:
        Number(fila[18]) || 0,

      observaciones:
        fila[19] || ""

    });

  }


  return registros;

}


/* =========================================================
   ENVIAR FACTURAS POR CORREO
   ========================================================= */

function enviarFacturasPorCorreo(
  ss,
  datos
) {

  const correo =
    String(
      datos.correo || ""
    ).trim();


  const desde =
    String(
      datos.desde || ""
    ).trim();


  const hasta =
    String(
      datos.hasta || ""
    ).trim();


  const tipoEnvio =
    String(
      datos.tipoEnvio ||
      "todas"
    ).trim();


  /*
   * CORREO
   */

  if (!correo) {

    throw new Error(
      "Debes indicar un correo electrónico."
    );

  }


  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(correo)
  ) {

    throw new Error(
      "El correo electrónico no es válido."
    );

  }


  /*
   * FECHAS
   */

  if (
    !/^\d{4}-\d{2}$/.test(desde) ||
    !/^\d{4}-\d{2}$/.test(hasta)
  ) {

    throw new Error(
      "El período seleccionado no es válido."
    );

  }


  if (
    desde > hasta
  ) {

    throw new Error(
      "El mes inicial no puede ser posterior al final."
    );

  }


  /*
   * TIPO
   */

  if (
    ![
      "compras",
      "emitidas",
      "todas"
    ].includes(tipoEnvio)
  ) {

    throw new Error(
      "El tipo de documentación no es válido."
    );

  }


  const documentos = [];


  /*
   * COMPRAS
   */

  if (
    tipoEnvio === "compras" ||
    tipoEnvio === "todas"
  ) {

    cargarDocumentosHoja(

      ss.getSheetByName(
        HOJA_COMPRAS
      ),

      "Compra",

      desde,

      hasta,

      documentos

    );

  }


  /*
   * FACTURAS EMITIDAS
   */

  if (
    tipoEnvio === "emitidas" ||
    tipoEnvio === "todas"
  ) {

    cargarDocumentosHoja(

      ss.getSheetByName(
        HOJA_FACTURACION
      ),

      "Factura emitida",

      desde,

      hasta,

      documentos

    );

  }


  /*
   * SIN DOCUMENTOS
   */

  if (
    !documentos.length
  ) {

    throw new Error(
      "No hay facturas adjuntas en el período seleccionado."
    );

  }


  /*
   * LÍMITE DE TAMAÑO
   *
   * Usamos 20 MB por correo
   * para mantener margen.
   */

  const LIMITE_BYTES =
    20 *
    1024 *
    1024;


  const lotes = [];


  let loteActual = [];


  let tamañoActual = 0;


  documentos.forEach(
    documento => {

      const tamaño =
        documento.blob
          .getBytes()
          .length;


      /*
       * Si el siguiente archivo
       * hace superar el límite,
       * cerramos el lote.
       */

      if (
        loteActual.length &&
        tamañoActual +
          tamaño >
          LIMITE_BYTES
      ) {

        lotes.push(
          loteActual
        );


        loteActual = [];


        tamañoActual = 0;

      }


      loteActual.push(
        documento
      );


      tamañoActual +=
        tamaño;

    }
  );


  if (
    loteActual.length
  ) {

    lotes.push(
      loteActual
    );

  }


  const desdeTexto =
    formatearMes(
      desde
    );


  const hastaTexto =
    formatearMes(
      hasta
    );


  /*
   * ENVIAR CADA LOTE
   */

  for (
    let i = 0;
    i < lotes.length;
    i++
  ) {

    const lote =
      lotes[i];


    const adjuntos =
      lote.map(
        documento =>
          documento.blob
      );


    const parte =
      lotes.length > 1

        ? " (" +
          (i + 1) +
          "/" +
          lotes.length +
          ")"

        : "";


    const asunto =
      "Control Fiscal · Documentación " +
      desdeTexto +

      (
        desde !== hasta
          ? " - " +
            hastaTexto
          : ""
      ) +

      parte;


    const lista =
      lote
        .map(
          documento => {

            const fechaTexto =
              Utilities.formatDate(
                documento.fecha,
                Session.getScriptTimeZone(),
                "dd/MM/yyyy"
              );


            return `
              <li>
                ${fechaTexto}
                · ${escaparHtml(
                    documento.tercero
                  )}
                · ${escaparHtml(
                    documento.concepto
                  )}
                · ${escaparHtml(
                    documento.tipo
                  )}
              </li>
            `;

          }
        )
        .join("");


    const cuerpo = `

      <div
        style="
          font-family:Arial,sans-serif
        "
      >

        <h2>
          Control Fiscal
        </h2>


        <p>
          Documentación correspondiente
          al período:
        </p>


        <p>

          <strong>

            ${escaparHtml(
              desdeTexto
            )}

            ${
              desde !== hasta
                ? " - " +
                  escaparHtml(
                    hastaTexto
                  )
                : ""
            }

          </strong>

        </p>


        <p>

          Documentos adjuntos:

          <strong>
            ${lote.length}
          </strong>

        </p>


        <ul>

          ${lista}

        </ul>


        <p
          style="color:#777"
        >

          Enviado automáticamente
          desde Control Fiscal.

        </p>


      </div>

    `;


    MailApp.sendEmail({

      to:
        correo,

      subject:
        asunto,

      htmlBody:
        cuerpo,

      attachments:
        adjuntos

    });

  }


  return {

    documentos:
      documentos.length,

    correos:
      lotes.length

  };

}


/* =========================================================
   CARGAR DOCUMENTOS DE UNA HOJA
   ========================================================= */

function cargarDocumentosHoja(
  hoja,
  tipo,
  desde,
  hasta,
  documentos
) {

  if (!hoja) {
    return;
  }


  const datos =
    hoja
      .getDataRange()
      .getValues();


  if (
    datos.length <= 1
  ) {

    return;

  }


  for (
    let i = 1;
    i < datos.length;
    i++
  ) {

    const fila =
      datos[i];


    const fecha =
      fila[0];


    const tercero =
      fila[1] || "";


    const concepto =
      fila[2] || "";


    const facturaUrl =
      fila[7] || "";


    /*
     * Fecha válida
     */

    if (
      !(fecha instanceof Date)
    ) {

      continue;

    }


    /*
     * Obtener año-mes
     */

    const mes =
      Utilities.formatDate(
        fecha,
        Session.getScriptTimeZone(),
        "yyyy-MM"
      );


    /*
     * Filtrar período
     */

    if (
      mes < desde ||
      mes > hasta
    ) {

      continue;

    }


    /*
     * Solo documentos
     * con archivo.
     */

    if (!facturaUrl) {

      continue;

    }


    /*
     * Obtener ID de Drive
     */

    const id =
      extraerIdDrive(
        facturaUrl
      );


    if (!id) {

      continue;

    }


    try {

      const archivo =
        DriveApp.getFileById(
          id
        );


      const blob =
        archivo.getBlob();


      documentos.push({

        blob:
          blob,

        nombre:
          archivo.getName(),

        tercero:
          tercero,

        concepto:
          concepto,

        tipo:
          tipo,

        fecha:
          fecha

      });


    } catch (error) {

      console.log(
        "No se pudo acceder al archivo de la fila " +
        (i + 1) +
        ": " +
        error.message
      );

    }

  }

}


/* =========================================================
   EXTRAER ID DE DRIVE
   ========================================================= */

function extraerIdDrive(
  url
) {

  const texto =
    String(url || "");


  const encontrado =
    texto.match(
      /[-\w]{25,}/
    );


  return encontrado
    ? encontrado[0]
    : "";

}


/* =========================================================
   FORMATEAR MES
   ========================================================= */

function formatearMes(
  valor
) {

  const partes =
    String(valor).split("-");


  if (
    partes.length !== 2
  ) {

    return valor;

  }


  const año =
    partes[0];


  const mes =
    Number(
      partes[1]
    );


  const meses = [

    "Enero",

    "Febrero",

    "Marzo",

    "Abril",

    "Mayo",

    "Junio",

    "Julio",

    "Agosto",

    "Septiembre",

    "Octubre",

    "Noviembre",

    "Diciembre"

  ];


  return (
    meses[mes - 1] +
    " " +
    año
  );

}


/* =========================================================
   ESCAPAR HTML
   ========================================================= */

function escaparHtml(
  texto
) {

  return String(
    texto || ""
  )

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================================================
   FECHAS
   ========================================================= */

function convertirFecha(
  fecha
) {

  if (
    fecha instanceof Date
  ) {

    return fecha.toISOString();

  }


  if (!fecha) {

    return "";

  }


  const fechaConvertida =
    new Date(fecha);


  if (
    isNaN(
      fechaConvertida.getTime()
    )
  ) {

    return String(
      fecha
    );

  }


  return fechaConvertida.toISOString();

}


/* =========================================================
   REDONDEAR
   ========================================================= */

function redondear(
  numero
) {

  return Math.round(

    (
      Number(numero) +
      Number.EPSILON
    ) *
    100

  ) / 100;

}


/* =========================================================
   RESPUESTA
   ========================================================= */

function respuesta(
  objeto
) {

  return ContentService

    .createTextOutput(
      JSON.stringify(
        objeto
      )
    )

    .setMimeType(
      ContentService.MimeType.JSON
    );

}

function autorizarCorreo() {

  const cuota =
    MailApp.getRemainingDailyQuota();

  Logger.log(
    "Cuota diaria disponible: " +
    cuota
  );

}

/* =========================================================
   CONFIGURACIÓN DE FACTURACIÓN
   ========================================================= */

function obtenerHojaConfiguracion(ss) {
  let hoja = ss.getSheetByName(HOJA_CONFIG);
  if (!hoja) {
    hoja = ss.insertSheet(HOJA_CONFIG);
    hoja.getRange("A1:B1").setValues([["Clave", "Valor"]]);
    hoja.getRange("A1:B1").setFontWeight("bold");
  }
  return hoja;
}

function leerConfiguracion(ss) {
  const hoja = obtenerHojaConfiguracion(ss);
  const resultado = {};
  if (hoja.getLastRow() < 2) return resultado;
  const datos = hoja.getRange(2, 1, hoja.getLastRow() - 1, 2).getValues();
  datos.forEach(fila => {
    const clave = String(fila[0] || "").trim();
    if (clave) resultado[clave] = String(fila[1] || "");
  });
  return resultado;
}

function guardarConfiguracion(ss, datos) {
  const hoja = obtenerHojaConfiguracion(ss);
  const config = parseJsonSeguro(datos.configuracion, {});
  const claves = ["name", "taxId", "address", "postalCode", "city", "province", "phone", "email", "iban"];
  const existentes = {};
  if (hoja.getLastRow() >= 2) {
    const valores = hoja.getRange(2, 1, hoja.getLastRow() - 1, 2).getValues();
    valores.forEach((fila, i) => {
      const clave = String(fila[0] || "").trim();
      if (clave) existentes[clave] = i + 2;
    });
  }
  claves.forEach(clave => {
    const valor = String(config[clave] || "");
    if (existentes[clave]) hoja.getRange(existentes[clave], 2).setValue(valor);
    else hoja.appendRow([clave, valor]);
  });
  SpreadsheetApp.flush();
  return { ok: true, configuracion: leerConfiguracion(ss) };
}

/* =========================================================
   TIENDAS Y PROVEEDORES - V29
   ========================================================= */

function obtenerHojaListas(ss) {

  let hoja = ss.getSheetByName(HOJA_LISTAS);

  if (!hoja) {

    hoja = ss.insertSheet(HOJA_LISTAS);

    hoja.getRange("A1:C1").setValues([
      ["Categoría", "Nombre", "Activo"]
    ]);

    hoja.getRange("A1:C1").setFontWeight("bold");
  }

  return hoja;
}


/* =========================================================
   LISTAR TIENDAS Y PROVEEDORES
   ========================================================= */

function leerListas(ss) {

  const hoja = obtenerHojaListas(ss);

  /*
   * Si la hoja está vacía, importar las tiendas
   * existentes en Compras.
   */

  if (hoja.getLastRow() <= 1) {
    importarTiendasDesdeCompras(ss);
  }

  const datos = hoja.getDataRange().getValues();

  const tiendas = [];
  const proveedores = [];

  for (let i = 1; i < datos.length; i++) {

    const categoria =
      String(datos[i][0] || "").trim();

    const nombre =
      String(datos[i][1] || "").trim();

    const activo = datos[i][2];

    if (!nombre) continue;

    if (
      activo === false ||
      String(activo).toLowerCase() === "false"
    ) {
      continue;
    }

    if (
      categoria.toLowerCase() === "tienda"
    ) {

      tiendas.push(nombre);

    } else if (
      categoria.toLowerCase() === "proveedor"
    ) {

      proveedores.push(nombre);
    }
  }

  return {
    tiendas: ordenarLista(tiendas),
    proveedores: ordenarLista(proveedores)
  };
}


/* =========================================================
   IMPORTAR TIENDAS DE COMPRAS
   ========================================================= */

function importarTiendasDesdeCompras(ss) {

  const compras =
    ss.getSheetByName(HOJA_COMPRAS);

  if (!compras) return;

  const hoja =
    obtenerHojaListas(ss);

  const ultimaFila =
    compras.getLastRow();

  if (ultimaFila < 2) return;

  const valores =
    compras
      .getRange(
        2,
        COLUMNA_TIENDA,
        ultimaFila - 1,
        1
      )
      .getValues();

  const nombres = [];

  valores.forEach(fila => {

    const nombre =
      String(fila[0] || "").trim();

    if (nombre) {
      nombres.push(nombre);
    }
  });

  const unicos =
    ordenarLista(nombres);

  if (!unicos.length) return;

  const filas = unicos.map(nombre => [
    "Tienda",
    nombre,
    true
  ]);

  hoja
    .getRange(
      2,
      1,
      filas.length,
      3
    )
    .setValues(filas);
}


/* =========================================================
   GUARDAR TIENDA / PROVEEDOR
   ========================================================= */

function guardarTercero(ss, datos) {

  const nombre =
    String(datos.nombre || "").trim();

  const categoriaEntrada =
    String(datos.categoria || "").trim();

  if (!nombre) {
    throw new Error("Falta el nombre.");
  }

  let categoria = "";

  if (
    categoriaEntrada.toLowerCase() === "tienda" ||
    categoriaEntrada.toLowerCase() === "tiendas"
  ) {

    categoria = "Tienda";

  } else if (
    categoriaEntrada.toLowerCase() === "proveedor" ||
    categoriaEntrada.toLowerCase() === "proveedores"
  ) {

    categoria = "Proveedor";

  } else {

    throw new Error(
      "Categoría no válida."
    );
  }

  const hoja =
    obtenerHojaListas(ss);

  const ultimaFila =
    hoja.getLastRow();

  if (ultimaFila >= 2) {

    const datosHoja =
      hoja
        .getRange(
          2,
          1,
          ultimaFila - 1,
          3
        )
        .getValues();

    for (let i = 0; i < datosHoja.length; i++) {

      const categoriaExistente =
        String(
          datosHoja[i][0] || ""
        ).trim();

      const nombreExistente =
        String(
          datosHoja[i][1] || ""
        ).trim();

      if (
        categoriaExistente.toLowerCase() ===
          categoria.toLowerCase() &&
        nombreExistente.toLowerCase() ===
          nombre.toLowerCase()
      ) {

        hoja
          .getRange(
            i + 2,
            1,
            1,
            3
          )
          .setValues([[
            categoria,
            nombre,
            true
          ]]);

        return {
          ok: true,
          mensaje: "Elemento actualizado."
        };
      }
    }
  }

  hoja.appendRow([
    categoria,
    nombre,
    true
  ]);

  return {
    ok: true,
    mensaje: "Elemento añadido."
  };
}


/* =========================================================
   ELIMINAR TIENDA / PROVEEDOR
   ========================================================= */

function eliminarTercero(ss, datos) {

  const nombre =
    String(datos.nombre || "").trim();

  const categoriaEntrada =
    String(datos.categoria || "").trim();

  if (!nombre) {
    throw new Error("Falta el nombre.");
  }

  let categoria = "";

  if (
    categoriaEntrada.toLowerCase() === "tienda" ||
    categoriaEntrada.toLowerCase() === "tiendas"
  ) {

    categoria = "Tienda";

  } else if (
    categoriaEntrada.toLowerCase() === "proveedor" ||
    categoriaEntrada.toLowerCase() === "proveedores"
  ) {

    categoria = "Proveedor";

  } else {

    throw new Error(
      "Categoría no válida."
    );
  }

  const hoja =
    obtenerHojaListas(ss);

  const ultimaFila =
    hoja.getLastRow();

  if (ultimaFila < 2) {

    return {
      ok: true,
      mensaje: "No hay elementos."
    };
  }

  const datosHoja =
    hoja
      .getRange(
        2,
        1,
        ultimaFila - 1,
        3
      )
      .getValues();

  for (let i = 0; i < datosHoja.length; i++) {

    const categoriaExistente =
      String(
        datosHoja[i][0] || ""
      ).trim();

    const nombreExistente =
      String(
        datosHoja[i][1] || ""
      ).trim();

    if (
      categoriaExistente.toLowerCase() ===
        categoria.toLowerCase() &&
      nombreExistente.toLowerCase() ===
        nombre.toLowerCase()
    ) {

      /*
       * NO eliminamos la compra histórica.
       * Solo desactivamos el nombre.
       */

      hoja
        .getRange(
          i + 2,
          3
        )
        .setValue(false);

      return {
        ok: true,
        mensaje: "Elemento eliminado."
      };
    }
  }

  return {
    ok: true,
    mensaje: "Elemento no encontrado."
  };
}


/* =========================================================
   ORDENAR LISTA
   ========================================================= */

function ordenarLista(lista) {

  const mapa = new Map();

  lista.forEach(nombre => {

    const limpio =
      String(nombre || "").trim();

    if (!limpio) return;

    const clave =
      limpio.toLocaleLowerCase("es");

    if (!mapa.has(clave)) {
      mapa.set(clave, limpio);
    }
  });

  return Array
    .from(mapa.values())
    .sort(
      (a, b) =>
        a.localeCompare(
          b,
          "es",
          {
            sensitivity: "base"
          }
        )
    );
}


/* =========================================================
   INGRESOS PENDIENTES DE FACTURA
   ========================================================= */
function obtenerHojaIngresosPendientes(ss){
  let hoja=ss.getSheetByName(HOJA_INGRESOS_INDEPENDIENTES);
  if(!hoja){
    const antigua=ss.getSheetByName(HOJA_INGRESOS_LEGACY);
    if(antigua){
      antigua.setName(HOJA_INGRESOS_INDEPENDIENTES);
      hoja=antigua;
    }
  }
  if(!hoja){
    hoja=ss.insertSheet(HOJA_INGRESOS_INDEPENDIENTES);
    hoja.getRange(1,1,1,7).setValues([[
      "ID","Fecha","Persona","Tipo de servicio","Precio material","Importe cobrado","Beneficio"
    ]]);
    hoja.getRange(1,1,1,7).setFontWeight("bold");
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function leerIngresosPendientes(ss){
  const hoja=obtenerHojaIngresosPendientes(ss);
  const lr=hoja.getLastRow();
  if(lr<2)return [];
  const values=hoja.getRange(2,1,lr-1,7).getValues();
  return values.map(r=>({
    id:String(r[0]||""),
    fecha:r[1] instanceof Date?r[1].toISOString():String(r[1]||""),
    persona:String(r[2]||""),
    servicio:String(r[3]||""),
    material:Number(r[4])||0,
    cobrado:Number(r[5])||0,
    beneficio:Number(r[6])||0
  })).filter(x=>x.id||x.persona||x.servicio);
}

function guardarIngresoPendiente(ss,datos){
  const lock=LockService.getDocumentLock();
  lock.waitLock(15000);
  try{
    const ingreso=parseJsonSeguro(datos.ingreso,{});
    const id=String(ingreso.id||("IP-"+Date.now()+"-"+Math.floor(Math.random()*10000))).trim();
    const persona=String(ingreso.persona||"").trim();
    const servicio=String(ingreso.servicio||"").trim();
    const material=Math.max(0,Number(ingreso.material)||0);
    const cobrado=Math.max(0,Number(ingreso.cobrado)||0);
    if(!persona)throw new Error("Falta la persona.");
    if(!servicio)throw new Error("Falta el tipo de servicio.");
    if(cobrado<=0)throw new Error("El importe cobrado debe ser mayor que 0.");
    const beneficio=redondear(cobrado-material);
    const hoja=obtenerHojaIngresosPendientes(ss),lr=hoja.getLastRow();
    const fila=[id,new Date(),persona,servicio,redondear(material),redondear(cobrado),beneficio];
    if(lr>=2){
      const ids=hoja.getRange(2,1,lr-1,1).getValues().map(r=>String(r[0]||""));
      const idx=ids.findIndex(x=>x===id);
      if(idx>=0){
        hoja.getRange(idx+2,1,1,7).setValues([fila]);
        SpreadsheetApp.flush();
        return {ok:true,id,mensaje:"Ingreso actualizado."};
      }
    }
    hoja.appendRow(fila);
    SpreadsheetApp.flush();
    return {ok:true,id,mensaje:"Ingreso guardado."};
  } finally {
    lock.releaseLock();
  }
}

function eliminarIngresoPendiente(ss,datos){
  const id=String(datos.id||"").trim();
  if(!id)throw new Error("Falta el ID del ingreso.");
  const hoja=obtenerHojaIngresosPendientes(ss),lr=hoja.getLastRow();
  if(lr<2)return {ok:true};
  const ids=hoja.getRange(2,1,lr-1,1).getValues().map(r=>String(r[0]||""));
  const idx=ids.findIndex(x=>x===id);
  if(idx>=0){hoja.deleteRow(idx+2);SpreadsheetApp.flush();return {ok:true,mensaje:"Ingreso eliminado."};}
  return {ok:true,mensaje:"Ingreso no encontrado."};
}

/* =========================================================
   INVENTARIO
   ========================================================= */
function obtenerHojaInventario(ss){
  let hoja=ss.getSheetByName(HOJA_INVENTARIO);
  if(!hoja){
    hoja=ss.insertSheet(HOJA_INVENTARIO);
    hoja.getRange(1,1,1,10).setValues([["ID","Actualizado","Artículo","Categoría","Cantidad","Unidad","Mínimo","Ubicación","Estado","Notas"]]);
    hoja.getRange(1,1,1,10).setFontWeight("bold");
  }
  return hoja;
}
function leerInventario(ss){
  const hoja=obtenerHojaInventario(ss), lr=hoja.getLastRow();
  if(lr<2)return [];
  const values=hoja.getRange(2,1,lr-1,10).getValues();
  return values.map(r=>({id:String(r[0]||""),actualizado:r[1] instanceof Date?r[1].toISOString():String(r[1]||""),articulo:String(r[2]||""),categoria:String(r[3]||""),cantidad:Number(r[4])||0,unidad:String(r[5]||"unidades"),minimo:Number(r[6])||0,ubicacion:String(r[7]||""),estado:String(r[8]||"Disponible"),notas:String(r[9]||"")})).filter(x=>x.id||x.articulo);
}
function guardarInventario(ss,datos){
  const lock=LockService.getDocumentLock();
  lock.waitLock(15000);
  try{
    let item={};
    try{ item=JSON.parse(String(datos.item||"{}")); }catch(e){ throw new Error("Datos de inventario no válidos."); }
    const id=String(item.id||("INV-"+Date.now()+"-"+Math.floor(Math.random()*10000))).trim();
    const articulo=String(item.articulo||"").trim();
    if(!articulo)throw new Error("Falta el nombre del material.");
    const hoja=obtenerHojaInventario(ss), lr=hoja.getLastRow();
    const fila=[id,new Date(),articulo,String(item.categoria||"Otros"),Math.max(0,Number(item.cantidad)||0),String(item.unidad||"unidades"),Math.max(0,Number(item.minimo)||0),String(item.ubicacion||""),String(item.estado||"Disponible"),String(item.notas||"")];
    if(lr>=2){
      const ids=hoja.getRange(2,1,lr-1,1).getValues().map(r=>String(r[0]||""));
      const idx=ids.findIndex(x=>x===id);
      if(idx>=0){hoja.getRange(idx+2,1,1,10).setValues([fila]);SpreadsheetApp.flush();return {ok:true,mensaje:"Material actualizado.",id};}
    }
    hoja.appendRow(fila);SpreadsheetApp.flush();return {ok:true,mensaje:"Material guardado.",id};
  } finally { lock.releaseLock(); }
}
function eliminarInventario(ss,datos){
  const lock=LockService.getDocumentLock();
  lock.waitLock(15000);
  try{
    const id=String(datos.id||"").trim();
    if(!id)throw new Error("Falta el ID del material.");
    const hoja=obtenerHojaInventario(ss),lr=hoja.getLastRow();
    if(lr<2)return {ok:true};
    const ids=hoja.getRange(2,1,lr-1,1).getValues().map(r=>String(r[0]||""));
    const idx=ids.findIndex(x=>x===id);
    if(idx>=0){hoja.deleteRow(idx+2);SpreadsheetApp.flush();return {ok:true,mensaje:"Material eliminado."};}
    return {ok:true,mensaje:"Material no encontrado."};
  } finally { lock.releaseLock(); }
}

/* =========================================================
   AGENDA
   ========================================================= */
function obtenerHojaAgenda(ss){
  let hoja=ss.getSheetByName(HOJA_AGENDA);
  if(!hoja){
    hoja=ss.insertSheet(HOJA_AGENDA);
    hoja.getRange(1,1,1,9).setValues([["ID","Fecha","Hora inicio","Hora fin","Evento","Cliente","Ubicación","Qué llevar","Comentarios"]]);
    hoja.getRange(1,1,1,9).setFontWeight("bold");
  }
  return hoja;
}
function leerAgenda(ss){
  const hoja=obtenerHojaAgenda(ss),lr=hoja.getLastRow();
  if(lr<2)return [];
  const values=hoja.getRange(2,1,lr-1,9).getValues();
  return values.map(r=>({id:String(r[0]||""),fecha:r[1] instanceof Date?Utilities.formatDate(r[1],Session.getScriptTimeZone(),"yyyy-MM-dd"):String(r[1]||"").slice(0,10),horaInicio:String(r[2]||""),horaFin:String(r[3]||""),evento:String(r[4]||""),cliente:String(r[5]||""),ubicacion:String(r[6]||""),llevar:String(r[7]||""),comentarios:String(r[8]||"")})).filter(x=>x.id||x.evento);
}
function guardarEvento(ss,datos){
  let obj={};
  try{obj=JSON.parse(String(datos.evento||"{}"));}catch(e){throw new Error("Datos de evento no válidos.");}
  const id=String(obj.id||("EV-"+Date.now()+"-"+Math.floor(Math.random()*10000))).trim();
  const evento=String(obj.evento||"").trim(), fecha=String(obj.fecha||"").slice(0,10);
  if(!evento||!fecha)throw new Error("Falta el evento o la fecha.");
  const hoja=obtenerHojaAgenda(ss),lr=hoja.getLastRow();
  const parts=fecha.split("-");
  const fechaValor=parts.length===3?new Date(Number(parts[0]),Number(parts[1])-1,Number(parts[2])):fecha;
  const fila=[id,fechaValor,String(obj.horaInicio||""),String(obj.horaFin||""),evento,String(obj.cliente||""),String(obj.ubicacion||""),String(obj.llevar||""),String(obj.comentarios||"")];
  if(lr>=2){
    const ids=hoja.getRange(2,1,lr-1,1).getValues().map(r=>String(r[0]||""));
    const idx=ids.findIndex(x=>x===id);
    if(idx>=0){hoja.getRange(idx+2,1,1,9).setValues([fila]);return {ok:true,mensaje:"Evento actualizado.",id};}
  }
  hoja.appendRow(fila);return {ok:true,mensaje:"Evento guardado.",id};
}
function eliminarEvento(ss,datos){
  const id=String(datos.id||"").trim();if(!id)throw new Error("Falta el ID del evento.");
  const hoja=obtenerHojaAgenda(ss),lr=hoja.getLastRow();if(lr<2)return {ok:true};
  const ids=hoja.getRange(2,1,lr-1,1).getValues().map(r=>String(r[0]||""));
  const idx=ids.findIndex(x=>x===id);if(idx>=0){hoja.deleteRow(idx+2);return {ok:true,mensaje:"Evento eliminado."};}
  return {ok:true,mensaje:"Evento no encontrado."};
}
