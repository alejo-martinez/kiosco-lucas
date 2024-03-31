const showError = (message) => {
    const divError = document.getElementById('divError');
    if(message === 'Missing credentials') divError.innerHTML = `<p>Completá todos los campos</p>`;
    else divError.innerHTML = `<p>${message}</p>`;
}

const logIn = async(e)=>{
    e.preventDefault();
    const form = document.getElementById('formSingin')
    const data = new FormData(form);
    const obj = {};
    data.forEach((value, key)=> obj[key]=value);
    const response = await fetch('/api/session/login', {
        method:'POST',
        credentials:'include',
        headers:{
            'Content-Type':'application/json'
        },
        body: JSON.stringify(obj)
    })
    const json = await response.json();
    if(json.status === 'success'){
        window.location.href = '/';
    }
    if(json.status === 'error'){
        showError(json.error);
    } 
}

const singUp = async(e)=>{
    e.preventDefault();
    const form = document.getElementById('formRegister');
    const data = new FormData(form)
    const obj = {}
    data.forEach((value, key)=> obj[key]=value); 

    const response = await fetch('/api/session/register', {
        method:'POST',
        credentials:'include',
        headers:{
            'Content-type': 'application/json'
        },
        body: JSON.stringify(obj)
    });
    const json = await response.json();
    if(json.status === 'success'){
        Toastify({
            text: "Usuario creado correctamente",
            duration: 3000,
        }).showToast();
    }
    if(json.status === 'error'){
        showError(json.message);
    }
}

const logOut = async(e)=>{
    e.preventDefault();
    const response = await fetch('/api/session/logout', {
        method:'DELETE',
        credentials:'include'
    });
    const json = await response.json();
    if(json.status === 'success'){
        window.location.href = '/login';
    }
    if(json.status === 'error'){
        showError(json.message)
    }
}