const createProd = async(e)=>{
    e.preventDefault();
    const form = document.getElementById('formAddProd');
    const data = new FormData(form);
    const obj = {};
    data.forEach((value, key)=> obj[key]=value);
    const response = await fetch('/api/products/create', {
        method:'POST',
        credentials:'include',
        headers:{
            'Content-Type':'application/json'
        },
        body: JSON.stringify(obj)
    });
    const json = await response.json();
    if(json.status === 'success'){
        const firstInput = document.getElementById('titleInput');
        Array.from(form).forEach(element=>{
            if(element.tagName.toLowerCase() === 'input') element.value='';
        })
        firstInput.focus();
        Toastify({
            text:  json.message,
            duration: 3000,

        }).showToast();
    }
    if(json.status === 'error'){
        document.getElementById('divError').innerHTML= `<p>${json.error}</p>`;
    }
}

const openEdit = (e, field)=>{
    e.preventDefault();
    const divInpt = document.getElementById(`input${field}`);
    const divText = document.getElementById(`text${field}`);
    divText.classList.add('hide');
    divInpt.classList.remove('hide');
}

const editProd = async(e, field, id)=>{
    e.preventDefault();
    const input = document.getElementById(`value${field}`);
    const response = await fetch(`/api/products/update/${id}`,{
        method:'PUT',
        credentials:'include',
        headers:{
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({field:field, value: input.value})
    });
    const json = await response.json();
    if(json.status === 'success'){
        const divInpt = document.getElementById(`input${field}`);
        const divText = document.getElementById(`text${field}`);
        const span = document.getElementById(`span${field}`);
        span.innerText = input.value;
        divText.classList.remove('hide');
        divInpt.classList.add('hide');
        Toastify({text: json.message, duration: 3000}).showToast();
    }
    if(json.status === 'error'){
        Toastify({text: json.error, duration: 5000}).showToast();
    }
}