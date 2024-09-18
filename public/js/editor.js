const editor = document.querySelector("#main-editor");
const listTours = document.querySelector("#list-tours");
const lightbox = document.querySelector(".lightbox");

const formInsert = document.querySelector("#main-editor");
let markers = 2; // 2 marcadores em tela;
let next_tour_id;

let state = {};

let insertMarkers =  [];
let editMarkers = [];

const label = {
  "marker-name": "Nome do marcador",
  "area-id": "ID da imagem",
  "marker-position": "Position"
}
  
/* const marker_tpl = (pos, markerObj) => `
    <div class="form-line" data-id="${pos}">
      <input type="text" name="marker[${marker}][marker-name]" data-id="${pos}" placeholder="Nome do marcador" value="${marker["marker-name"]}"/>
      <input type="text" name="marker[${marker}][area-id]" data-id="${pos}" placeholder="ID da imagem" value="${marker["area-id"]}"/>
      <input type="text" name="marker[${marker}][position]" data-id="${pos}" placeholder="Position" value="${marker["position"]}"/>
      <span class="btn delete" onClick="deleteMarker(event)">X</span>
    </div>
`;*/

const marker_tpl = (index, marker) => `
  <div class="form-line" data-id="${index}">
    <input type="text" name="marker[${index}][marker-name]" data-id="${index}" placeholder="${label["marker-name"]}" value="${marker["marker-name"]}"/>
    <input type="text" name="marker[${index}][area-id]" data-id="${index}" placeholder="${label["area-id"]}" value="${marker["area-id"]}"/>
    <input type="text" name="marker[${index}][position]" data-id="${index}" placeholder="${label["marker-position"]}" value="${marker["position"]}"/>
    <span class="btn delete" onClick="deleteMarker(event)">
      <i class="fa-regular fa-trash-can"></i>
    </span>
  </div>
`;

function renderMarkers (markers) {
  let markers_str = '';

  for (let [index, marker] of markers.entries()) {
    console.log("Render Markers: ", index, marker);
    markers_str += marker_tpl(index, marker);
  }

  return markers_str;

}


const render_tpl = (params) => {
  let {markers} = params;
  
  // console.log(markers);
  
  return (`
  <div id="page-form-edit" class="">
    <form type="" id="form-insert" class="form">
      <span id="next-tour-id"></span><br>
      <div class="form-row">
        <div class="input-group">
          <label>Nome da imagem</label>
          <input type="text" name="name"/>
        </div>
        
        <div class="input-group">
          <label>Ambiente</label>
          <input type="text" name="room"/>
        </div>
        
        <div class="input-group">
          <label>Ordenar posição</label>
          <input type="text" name="page_order"/>
        </div>
      </div>
      
      <div class="form-row">
        <div class="input-group">
          <label>Link da Imagem</label>
          <input type="text" name="image_sky"/>
        </div>
        <div class="input-group">
          <label>Rotação da Imagem</label>
          <input type="text" name="image_rotation" value="0 -90 0"/>
        </div>
      </div>   
      
      <div class="form-row">
        <div class="input-group">
          <label>Áudio URL</label>
          <input type="text" name="audio_url" class="inline"/>
        </div>
        <div class="input-group">
          <br>
          <label class="label-inline">Ativar áudio</label>
          <input type="checkbox" name="audio_permission"/>
        </div>
      </div>  
        
      <div id="form-links-tpl" class="form-links">
        <label>Linkar áreas</label>
        <!-- <div class="form-line" data-id="0">
          <input type="text" name="marker[0][marker-name]" data-id="0"placeholder="Nome do marcador" value="Marker 1"/>
          <input type="text" name="marker[0][area-id]" data-id="0" placeholder="ID da imagem"/>
          <input type="text" name="marker[0][position]" data-id="0" placeholder="Position" value="-32.491 0.695 -13.170"/>
          <span class="btn delete" onCLick="deleteMarker()">
            <i class="fa-regular fa-trash-can"></i>
          </span>
        </div>
        
        <div class="form-line" data-id="1">
          <input type="text" name="marker[1][marker-name]" placeholder="Nome do marcador" value="Marker 2"/>
          <input type="text" name="marker[1][area-id]" placeholder="ID da imagem"/>
          <input type="text" name="marker[1][position]" placeholder="Position" value="23.346 0.695 -43.713"/>
          <span class="btn delete">
            <i class="fa-regular fa-trash-can"></i>
          </span>
        </div> -->
        
        ${renderMarkers(markers)}
        
      </div>
      
      <div class="marker-actions">
        <button id="add-more-marker" class="btn" onClick="addMoreMarker(event, '#form-links-tpl')">Adicionar +</button>
      </div>  
      
      <div class="action-line">
        <input type="submit" value="Salvar" id="save" class="btn">
      </div>
      
    </form>
  </div>  
`)
};

const renderEdit= function (data) {
  
  /*const marker_tpl = (index, marker) => `
    <div class="form-line" data-id="${index}">
      <input type="text" name="marker[${index}][marker-name]" data-id="${index}" placeholder="Nome do marcador" value="${marker["marker-name"]}"/>
      <input type="text" name="marker[${index}][area-id]" data-id="${index}" placeholder="ID da imagem" value="${marker["area-id"]}"/>
      <input type="text" name="marker[${index}][position]" data-id="${index}" placeholder="Position" value="${marker["position"]}"/>
      <span class="btn delete" onClick="deleteMarker(event)">
        <i class="fa-regular fa-trash-can"></i>
      </span>
    </div>
  `;
  
  function renderMarkers (markers) {
    let markers_str = '';
    
    for (let [index, marker] of markers.entries()) {
      console.log(index, marker);
      markers_str += marker_tpl(index, marker);
    }
    
    return markers_str;
    
  } */
  
  const edit_tpl = (data) => `
  <div id="page-form-insert" class="">
    <form type="" id="form-edit" class="form">
      <input type="hidden" name="id" value="${data.id}"/>
      
      <span id="next-tour-id"></span><br>
      <div class="form-row">
        <div class="input-group">
          <label>Nome da área</label>
          <input type="text" name="name" value="${data.name}"/>
        </div>
        
        <div class="input-group">
          <label>Room</label>
          <input type="text" name="room" value="${data.room}"/>
        </div>
        
        <div class="input-group">
          <label>Ordenar posição</label>
          <input type="text" name="page_order" value="${data.page_order}"/>
        </div>
      </div>
      
      <div class="form-row">
        <div class="input-group">
          <label>Imagem</label>
          <input type="text" name="image_sky" value="${data.image_sky}"/>
        </div>
        <div class="input-group">
          <label>Rotação da Imagem</label>
          <input type="text" name="image_rotation" value="${data.image_rotation}"/>
        </div>
      </div>   
      
      <div class="form-row">
        <div class="input-group">
          <label>Áudio URL</label>
          <input type="text" name="audio_url" class="inline" value="${data.audio_url}"/>
        </div>
        <div class="input-group">
          <br>
          <label class="label-inline">Ativar áudio</label>
          <input type="checkbox" name="audio_permission" value="${data.audio_permission}"/>
        </div>
      </div>  
        
      <div id="form-links-tpl-edit" class="form-links">
        <label>Linkar áreas</label>
        
        ${renderMarkers(data.markers)}
        
      </div>
      
      <div class="marker-actions">
        <button id="add-more-marker-edit" class="btn edit small" onClick="addMoreMarker(event, '#form-links-tpl-edit')">Adicionar +</button>
      </div>  
      
      <div class="action-line">
        <input type="submit" value="Salvar" id="save" onClick="saveFormEditor(event)" class="btn">
      </div>
      
    </form>
  </div>
`;
  
  return edit_tpl(data);
}

const deleteTour = async (id) => {
  //let id = event.target.dataset.id
  
  if (confirm(`Deseja deletar o Tour ${id}?`) == true) {
    
    const response = await fetch("https://tour-museu-ipiranga.glitch.me/api/delete/" + id, {
      method: "DELETE"
    });
    
    let message = await response.text();
    
    document.querySelector(`#tour-${id}`).remove();
    
    // alert(message);
  }
  //let data = await getArea(id);
  
  //let editForm = renderEdit(data);
  
  //openLightbox(editForm);
  
  console.log(id);
}

const editFormTour = async (id) => {
  let data = await getArea(id);
  let editForm = renderEdit(data);
  openLightbox(editForm);
  
  console.log("edit Form Tour: ", id);
}


const addMoreMarker = function (event, markersWrapperId) {
  event.preventDefault();
  event.stopPropagation();
  
  let markersWrapper = document.querySelector(`${markersWrapperId}`);
  let markers = markersWrapper.querySelectorAll(".form-line");
  let markersQty = markers.length;
  
  console.log("Add more marker: ", markersQty);
  
  //let markerNextId = Math.max([...markers].map(item => parseInt(item.dataset.id)));
  let markerNextId = markersQty > 0 ? Math.max(...[...markers].map(item => parseInt(item.dataset.id))) : 0 ; // index to length, Se markersQty == 0, nextId = 0
  let newMarker = markerNextId + 1;
  
  console.log("next id: ",markerNextId);
  
  // fix, corrige o erro se não houver menhum marker cadastado
  if (markersQty <= 0) {
    newMarker = 0;
  }
  
  if (markersQty >= 4) {
    alert("Não é possivel adicionar mais links");
    return;
  }
  
  let pos = markers == 2 ? "-26.107 0.695 -69.979" : "54.445 0.695 -4.773";
  
  let marker_tpl = `
    <div class="form-line" data-id="${newMarker}">
      <input type="text" name="marker[${newMarker}][marker-name]" data-id="${newMarker}" placeholder="Nome do marcador" value="Marker ${newMarker + 1}"/>
      <input type="text" name="marker[${newMarker}][area-id]" data-id="${newMarker}" placeholder="ID da imagem"/>
      <input type="text" name="marker[${newMarker}][position]" data-id="${newMarker}" placeholder="Position"/>
      <span class="btn delete" onClick="deleteMarker(event)">
        <i class="fa-regular fa-trash-can"></i>
      </span>
    </div>
  `;
  
  // document.querySelector("#form-links-tpl").insertAdjacentHTML('beforeend', marker_tpl);
  markersWrapper.insertAdjacentHTML('beforeend', marker_tpl);
  
  //markersQty++;
}

const deleteMarker = (event) => {
  let el = event.target ? event.target : event.srcElement;
  el.closest(".form-line").remove();
}


const getAreas = async function() {
  const response = await fetch("https://tour-museu-ipiranga.glitch.me/api/read")
  const list = await response.json(); 
  
  return list;
}

const getArea = async function(id) {
  const response = await fetch("https://tour-museu-ipiranga.glitch.me/api/read/" + id)
  
  return await response.json();
}

// actions

let saveFormEditor = async function (event) {
  event.preventDefault();
  event.stopPropagation();
  let $form;
  
  // console.log("save form event: ", event);
  
  let actionType = event
  
  //let fields = document.querySelector("#main-editor form")
  let data;
  
  if (event.target.nodeName == "INPUT") {
    data = new FormData(event.target.form);
    $form = event.target.form;
    
  } else {
    data = new FormData(event.target);
    $form = event.target.closest("form");
  }
  
  
  let values = Object.fromEntries(data.entries());
  
  console.log("Form Values: ", JSON.stringify(values));
  
  // console.log("Values: ", values.id);
  
  values = Object.keys(values).filter(objKey =>
    !objKey.match(/marker/) ).reduce((newObj, key) =>
    {
        newObj[key] = values[key];
        return newObj;
    }, {}
  );
  
  //let markersAll = document.querySelectorAll("#form-insert input[name^=marker]");
  let markersAll = $form.querySelectorAll("input[name^=marker]");
  let markers = [];
  
  for (let marker of markersAll) {
    let pos = marker.name.match(/\[(\d)\]/)[1];
    let key = marker.name.match(/\]\[(.*?)\]/)[1];
    let value = marker.value;
    
    if (!markers[pos]) {
      markers[pos] = {}
    }
    
    markers[pos] = Object.assign(markers[pos], {[key]: value})
  }
  
  values["markers"] = markers
  
  let endpoint, method;
  
  if (values.id) {
    endpoint = `https://tour-museu-ipiranga.glitch.me/api/update/${values.id}`;
    method = "PUT";
    
  } else {
    endpoint = "https://tour-museu-ipiranga.glitch.me/api/create";
    method = "POST";
  }
  
  try {
    
    //console.log("entrou no try");
    //console.log("method: ", method);
    //console.log("endpoint: ", endpoint);
  
    const response = await fetch(endpoint, {
      method: method,
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(values)
    });
    
    const result = await response.json();
    
    // console.log("Success:", result.message);
    alert("Tour inserido com sucesso!");
    location.reload();
    
    
  } catch (error) {
    console.error("Error:", error);
  }
  
}

const openLightbox = function (data) {
  let inner = lightbox.querySelector(".lightbox-inner");
  let closeBtn = `<span id="close-lightbox">X</span>`
  
  inner.insertAdjacentHTML('afterbegin', data);
  inner.insertAdjacentHTML('beforeend', closeBtn);
  
  lightbox.classList.toggle('active');
}

const closeLightbox = function (event) {
  if (event.target.id == "close-lightbox") {
    let inner = lightbox.querySelector(".lightbox-inner");
    
    lightbox.classList.toggle('active');
    inner.innerHTML = "";
  }
}



// init

let listAreas = async () => {
  const areas = await getAreas();
  
  let area_tpl = ``;

  if (areas.length) {
    for(let area of areas) {
      let image_url_arr = area.image_sky.split('/');
      image_url_arr[4] = "thumbnails%2F" + image_url_arr[4];
      
      area.image_thumb = image_url_arr.join("/");
      //let image_thumb = area.image_sky;
      
      let tpl = `
        <div id="tour-${area.id}" class="item" data-id="${area.id}">
          <div class="item-inner">
          
            <div class="col col-img">
              <img src="${area.image_thumb}" class="image_sky"/>
            </div>
            
            <div class="col col-title">
              <h3>ID da imagem: ${area.id}</h3>
              <p>Nome: ${area.name}</p>
              <p>Room: ${area.room}</p>
              <p><a class="link small" href="https://tour-museu-ipiranga.glitch.me/tour/${area.id}" target="_blank">Visualizar tour</a></p>
            </div>
            
            <div class="col col-actions">
              <button class="btn small delete" data-id="${area.id}" onClick="deleteTour(${area.id})">deletar</button>
              <button class="btn small edit" data-id="${area.id}" onClick="editFormTour(${area.id})">editar</button>
            </div>
          </div>
        </div>
      
      `;
      
      area_tpl += tpl;
    }
  }

  listTours.insertAdjacentHTML('afterbegin', area_tpl);

};

listAreas();


let initForm = function () {
  let params = {};
  
  params['markers'] = [
    {
      "area-id": "",
      "marker-name": "Marker 1",
      "position": "-32.491 0.695 -13.170"
    },
    {
      "area-id": "",
      "marker-name": "Marker 2",
      "position": "23.346 0.695 -43.713"
    }
  ]
  editor.insertAdjacentHTML('afterbegin', render_tpl(params));
}

initForm();


editor.addEventListener('submit', saveFormEditor);

// listTours.addEventListener('click', handleFormTour);

lightbox.addEventListener('click', closeLightbox);

document.querySelector("#add-more-marker").addEventListener('click', addMoreMarker);


