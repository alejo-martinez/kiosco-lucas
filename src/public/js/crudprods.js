const socket = io();

const createProd = async (e) => {
    e.preventDefault();
    const form = document.getElementById('formAddProd');
    const data = new FormData(form);
    const obj = {};
    data.forEach((value, key) => obj[key] = value);
    const response = await fetch('/api/products/create', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(obj)
    });
    const json = await response.json();
    if (json.status === 'success') {
        const firstInput = document.getElementById('titleInput');
        Array.from(form).forEach(element => {
            if (element.tagName.toLowerCase() === 'input') element.value = '';
        })
        firstInput.focus();
        Toastify({
            text: json.message,
            duration: 3000,

        }).showToast();
    }
    if (json.status === 'error') {
        document.getElementById('divError').innerHTML = `<p>${json.error}</p>`;
    }
}

const openEdit = (e, field) => {
    e.preventDefault();
    const divInpt = document.getElementById(`input${field}`);
    const divText = document.getElementById(`text${field}`);
    divText.classList.add('hide');
    divInpt.classList.remove('hide');
}

const closeEdit = (e, field) => {
    e.preventDefault();
    const divInpt = document.getElementById(`input${field}`);
    const divText = document.getElementById(`text${field}`);
    divText.classList.remove('hide');
    divInpt.classList.add('hide');
}

const editProd = async (e, field, id) => {
    e.preventDefault();
    const input = document.getElementById(`value${field}`);
    const response = await fetch(`/api/products/update/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ field: field, value: input.value })
    });
    const json = await response.json();
    console.log(json)
    if (json.status === 'success') {
        const divInpt = document.getElementById(`input${field}`);
        const divText = document.getElementById(`text${field}`);
        const span = document.getElementById(`span${field}`);
        span.innerText = input.value;
        divText.classList.remove('hide');
        divInpt.classList.add('hide');
        Toastify({ text: json.message, duration: 3000 }).showToast();
    }
    if (json.status === 'error') {
        Toastify({ text: json.error, duration: 5000 }).showToast();
    }
}

const searchProdCode = (e) => {
    e.preventDefault();
    const inputSearchCode = document.getElementById('inputSearchCode')
    const value = inputSearchCode.value;
    socket.emit('searchCode', { query: value });
}

const searchProdCodeUpdate = (e) => {
    e.preventDefault();
    const inputSearchCode = document.getElementById('inputSearchCodeUpdate')
    const value = inputSearchCode.value;
    socket.emit('searchCodeUpdate', { query: value });
}

socket.on('resultCodeUpdate', data =>{
    const divAllProducts = document.getElementById('divProductsUpdate');
    divAllProducts.classList.add('hiden');
    const divResults = document.getElementById('divResultsProdsUpdate');
    const inputSearchCode = document.getElementById('inputSearchCodeUpdate')
    let html = '';
    if (data.producto) {
        html = `<a href="/update/prod/${data.producto._id}">${data.producto.title}</a>`;
    }

    divResults.innerHTML = html;
    inputSearchCode.value = "";
})

socket.on('resultCode', data => {
    const divAllProducts = document.getElementById('divAllProducts');
    divAllProducts.classList.add('hiden');
    const divResults = document.getElementById('divResultsProds');
    const inputSearchCode = document.getElementById('inputSearchCode')
    let html = '';
    if (data.producto) {
        html = `<table class="table-products">
        <thead>
            <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Precio x Unidad Costo</th>
                <th>Precio x Unidad Venta</th>
                <th>Stock en tienda</th>
                <th>Stock Total</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>${data.producto.code}</td>
                <td>${data.producto.title}</td>
                <td>$ ${data.producto.costPrice}</td>
                <td>$ ${data.producto.sellingPrice}</td>
                <td>${data.producto.stock}</td>
                <td>${data.producto.totalStock}</td>
            </tr>
        </tbody>
    </table>`;
    }

    divResults.innerHTML = html;
    inputSearchCode.value = "";
})