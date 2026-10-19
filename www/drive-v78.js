/* Control Fiscal V78: módulo experimental aislado.
   Se usa únicamente con un token OAuth obtenido por Google Sign-In nativo.
   No colocar tokens en localStorage, URLs, logs ni Apps Script. */
(function(global){
  'use strict';
  const ROOT='https://www.googleapis.com';
  const APP_KEY='controlFiscalVersion';
  const VERSION='78';
  const TITLE='Control Fiscal - Datos fiscales';
  const TABS=['Configuracion','Compras','Facturas','Inventario','Clientes','Agenda','Ingresos'];
  function assertToken(token){
    if(typeof token!=='string'||token.length<20) throw new Error('Falta token OAuth válido');
  }
  async function request(token,path,method='GET',body){
    assertToken(token);
    const response=await fetch(ROOT+path,{
      method,
      headers:{Authorization:'Bearer '+token,...(body===undefined?{}:{'Content-Type':'application/json'})},
      ...(body===undefined?{}:{body:JSON.stringify(body)})
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error('Google API HTTP '+response.status+': '+(data.error?.message||'Error de solicitud'));
    return data;
  }
  async function findBooks(token){
    const q="mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false and appProperties has { key = '"+APP_KEY+"' and value = '"+VERSION+"' }";
    let pageToken,all=[];
    do{
      const params=new URLSearchParams({q,fields:'nextPageToken,files(id,name,appProperties,owners(emailAddress))',pageSize:'100'});
      if(pageToken) params.set('pageToken',pageToken);
      const res=await request(token,'/drive/v3/files?'+params);
      all.push(...(res.files||[]));pageToken=res.nextPageToken;
    }while(pageToken);
    return all;
  }
  async function createBook(token){
    // Sheets crea el documento en el Drive del usuario que autorizó el token.
    const spreadsheet=await request(token,'/sheets/v4/spreadsheets','POST',{
      properties:{title:TITLE},
      sheets:TABS.map(title=>({properties:{title}}))
    });
    const id=spreadsheet.spreadsheetId;
    if(!id) throw new Error('Google Sheets no devolvió ID');
    // Etiqueta privada de aplicación para descubrimiento tras reinstalación.
    try {
      await request(token,'/drive/v3/files/'+encodeURIComponent(id)+'?fields=id,name,appProperties','PATCH',{
        appProperties:{[APP_KEY]:VERSION}
      });
    } catch(error) {
      // No reintentar la creación: la hoja ya existe y podría duplicarse.
      throw new Error('La hoja se creó pero no pudo etiquetarse. Revisar Drive antes de reintentar. ID: '+id+'; '+error.message);
    }
    return {id,name:TITLE,created:true};
  }
  async function findOrCreateBook(token){
    const books=await findBooks(token);
    if(books.length>1) throw new Error('Se encontraron varios libros V78. Seleccionar uno antes de escribir; no crear otro.');
    if(books.length===1) return {id:books[0].id,name:books[0].name,created:false};
    return createBook(token);
  }
  async function readRange(token,id,range){
    return request(token,'/sheets/v4/spreadsheets/'+encodeURIComponent(id)+'/values/'+encodeURIComponent(range));
  }
  async function appendRows(token,id,range,rows){
    if(!Array.isArray(rows)||!rows.every(Array.isArray))throw new Error('Filas no válidas');
    return request(token,'/sheets/v4/spreadsheets/'+encodeURIComponent(id)+'/values/'+encodeURIComponent(range)+':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS','POST',{values:rows});
  }
  global.ControlFiscalDriveV78=Object.freeze({findBooks,findOrCreateBook,readRange,appendRows});
})(window);
