const showInputUser = (e, field)=>{
    e.preventDefault();
    const divInput = document.getElementById(`divInput${field}`);
    const divInfo = document.getElementById(`divInfo${field}`);
    divInput.classList.remove('hide');
    divInfo.classList.add('hide');
};

const editUser = async(e, id, field)=>{
    e.preventDefault();
    const inputValue = document.getElementById(`input${field}`).value;
    const response = await fetch(`/api/user/update/user/${id}`,{
        method:'PUT',
        credentials:'include',
        headers:{
            'Content-Type': 'application/json'
        },
        body:JSON.stringify({field: field, value: inputValue})
    });
    const json = await response.json();
    if(json.status === 'success'){
        const divInput = document.getElementById(`divInput${field}`);
        const divInfo = document.getElementById(`divInfo${field}`);
        if(field !== 'password'){
            const span = document.getElementById(`span${field}`);
            span.innerText = inputValue;
        }
        divInput.classList.add('hide');
        divInfo.classList.remove('hide');
        Toastify({text: json.message, duration: 3000}).showToast();
    }
    if(json.status === 'error'){
        Toastify({text: json.error, duration: 5000}).showToast();
    }
}