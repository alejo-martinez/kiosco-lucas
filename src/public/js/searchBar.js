const socket = io();
let idResume;

const inputSearch = document.getElementById('inputSearchTitle');
const divCart = document.getElementById('cart');
const inputCheckbox = document.getElementById('checkboxSearch')

const changeTypeSearch = (checkbox, e) => {
    e.preventDefault();
    const divSearchTitle = document.getElementById('divSearchTitle');
    const divSearchCode = document.getElementById('divSearchCode');
    const tbodySearch = document.getElementById('bodySearch');
    if (checkbox.checked) {
        divSearchTitle.classList.remove('hide');
        divSearchCode.classList.add('hide');
    } else {
        divSearchCode.classList.remove('hide');
        divSearchTitle.classList.add('hide');
    }
    inputSearch.value = '';
    tbodySearch.innerHTML = '';
}

inputSearch.addEventListener('input', async (e) => {
    e.preventDefault();
    const value = inputSearch.value;
    socket.emit('searchTitle', { query: value });

})

const searchProd = (e) => {
    e.preventDefault();
    const cid = divCart.getAttribute('data-cart');
    const inputSearchCode = document.getElementById('inputSearch')
    const value = inputSearchCode.value;
    socket.emit('search', { query: value, cid: cid });
}

const increase = (e, id) => {
    e.preventDefault();
    const spanQuantity = document.getElementById(`prodQuantity${id}`);
    const stockValue = document.getElementById(`stock${id}`).innerText;
    const quantityCart = document.getElementById(`quantity${id}`)?.innerText;
    if (quantityCart && (parseInt(quantityCart) + parseInt(spanQuantity.innerText) + 1 > parseInt(stockValue))) {

        Toastify({
            text: 'Límite de productos alcanzado',
            duration: 3000
        }).showToast()
    } else {
        if (parseInt(stockValue) === parseInt(spanQuantity.innerText)) {
            Toastify({
                text: 'Límite de productos alcanzado',
                duration: 3000
            }).showToast()

        }
        else {
            const newValue = parseInt(spanQuantity.innerText) + 1;
            spanQuantity.innerText = newValue
        }
    }
}

const decrease = (e, id) => {
    e.preventDefault();
    const spanQuantity = document.getElementById(`prodQuantity${id}`);

    if (parseInt(spanQuantity.innerText) == 0) {

        Toastify({
            text: 'La cantidad no puede ser menor a 0',
            duration: 3000
        }).showToast()

    }
    else {
        const newValue = parseInt(spanQuantity.innerText) - 1;
        spanQuantity.innerText = newValue
    }
}

const addProduct = (e, pid) => {
    e.preventDefault();
    const cid = divCart.getAttribute('data-cart');
    const quantity = document.getElementById(`prodQuantity${pid}`);
    socket.emit('addToCart', { pid: pid, cid: cid, quantity: quantity.innerText });
    quantity.innerText = 0;
}

socket.on('resultTitle', data => {
    const divResults = document.getElementById('bodySearch');
    let html = '';
    if (data.results && data.results.length > 0) {
        data.results.forEach(value => {
            html += `<tr class="tr-results">
                    <td>${value._id}</td>
                    <td>${value.title}</td>
                    <td id="stock${value._id}">${value.stock}</td>
                    <td><span>$ </span> <span>${value.sellingPrice}</span></td>
                    <td><div class="div-btn-quantity">
                    <button onclick="decrease(event,'${value._id}')" class="btn btn-quantity">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-dash-lg" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8"/>
                        </svg>
                    </button>
                    <span id="prodQuantity${value._id}">0</span>
                    <button onclick="increase(event,'${value._id}')" class="btn btn-quantity">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-lg" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"/>
                        </svg>
                    </button>
                </div></td>
                <td class="td-button"><button class="btn btn-add-prod" onclick="addProduct(event, '${value._id}')">Agregar</button></td>
                    </tr>`;
        });
    }
    divResults.innerHTML = html;
})

socket.on('result', data => {
    const divResults = document.getElementById('bodySearch');
    const inputSearchCode = document.getElementById('inputSearch')
    let html = '';
    if (data.results) {
        html += `<tr class="tr-results">
            <td>${data.results._id}</td>
            <td>${data.results.title}</td>
            <td id="stock${data.results._id}">${data.results.stock}</td>
            <td><span>$ </span> <span>${data.results.sellingPrice}</span></td>
            <td><div class="div-btn-quantity">
            <button onclick="decrease(event,'${data.results._id}')" class="btn btn-quantity">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-dash-lg" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8"/>
                </svg>
            </button>
            <span id="prodQuantity${data.results._id}">0</span>
            <button onclick="increase(event,'${data.results._id}')" class="btn btn-quantity">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-lg" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"/>
                </svg>
            </button>
        </div></td>
        <td class="td-button"><button class="btn btn-add-prod" onclick="addProduct(event, '${data.results._id}')">Agregar</button></td>
            </tr>`;
    }

    divResults.innerHTML = html;
    inputSearchCode.value = "";
    inputSearchCode.focus();
})

socket.on('updatedCart', data => {
    const tbody = document.getElementById('tbodyCart');
    const inputSearchCode = document.getElementById('inputSearch')

    if (data.cart.products.length === 0) return;
    else {
        const span = document.getElementById('totalPrice')
        let cartHTML = '';

        data.cart.products.forEach(product => {
            cartHTML += `<tr class="tr-results">
            <td>${product.product._id}</td>
            <td>${product.product.title}</td>
            <td id="quantity${product.product._id}">${product.quantity}</td>
            <td>$${product.product.sellingPrice}</td>
            <td>$${Number.isInteger(product.totalPrice) ? product.totalPrice.toFixed(2) : product.totalPrice.toFixed(2)}</td>
            <td><button class="btn btn-quantity btn-remove" onclick="removeProd(event, '${product.product._id}')"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg"
            viewBox="0 0 16 16">
            <path
                d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
        </svg></button></td>
        </tr>`;
        });
        span.innerText = `${Number(data.total).toFixed(2)}`;
        tbody.innerHTML = cartHTML;
        inputSearchCode.value = "";
        inputSearchCode.focus();
    }
})

const removeProd = (e, pid) => {
    e.preventDefault();
    const cid = divCart.getAttribute('data-cart');
    socket.emit('remove', { pid: pid, cid: cid });
}

socket.on('removeSuccess', data => {
    const tbody = document.getElementById('tbodyCart');
    Toastify({
        text: 'Producto removido.',
        duration: 3000
    }).showToast()
    const span = document.getElementById('totalPrice')
    let cartHTML = '';

    data.cart.products.forEach(product => {
        cartHTML += `<tr>
        <td>${product.product._id}</td>
        <td>${product.product.title}</td>
        <td id="quantity${product.product._id}">${product.quantity}</td>
        <td>$${product.product.sellingPrice}</td>
        <td>$${product.totalPrice}</td>
        <td><button class="btn btn-quantity btn-remove" onclick="removeProd(event, '${product.product._id}')"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg"
            viewBox="0 0 16 16">
            <path
                d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
        </svg></button></td>
    </tr>`;
    });
    span.innerText = `${data.total}`;
    tbody.innerHTML = cartHTML;
})

socket.on('removeError', data => {
    Toastify({
        text: data.error,
        duration: 3000
    }).showToast();
})

socket.on('errorUpdate', data => {
    Toastify({
        text: data.error,
        duration: 3000
    }).showToast();
    const inputSearchCode = document.getElementById('inputSearch')
    inputSearchCode.value = "";
    inputSearchCode.focus();
})

const cleanChange = (e) => {
    e.preventDefault();
    const dineroAbonado = document.getElementById("abonoInput");
    document.getElementById('divChange').innerHTML = '';
    dineroAbonado.value = 0;
}

const showChange = (total) => {
    const dineroAbonado = document.getElementById("abonoInput").value;
    if (!dineroAbonado || parseFloat(dineroAbonado) === 0) {
        Toastify({
            text: "Ingrese un monto",
            duration: 2500
        }).showToast();
    } else {
        const divChange = document.getElementById('divChange');
        const result = parseFloat(dineroAbonado) - parseFloat(total);
        divChange.innerHTML = `<span>Vuelto: $${Number.isInteger(result) ? result.toFixed(2) : result.toFixed(2)}</span>
    <button onclick="cleanChange(event)" class="btn btn-check"><i class="fa-solid fa-check"></i></button>`
    }
}

const endSale = async (e) => {
    e.preventDefault();
    const total = document.getElementById('totalPrice');
    const divInptAbono = document.getElementById("abonoInput").value;
    const optionSelect = document.getElementById('paymentMethod').value;
    if (Number(divInptAbono) < Number(total.innerText)){
        Toastify({text: 'Ingresa una cantidad superior al monto porfavor', duration: 3000}).showToast()
    }
    else {
        const response = await fetch('/api/ticket/create', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount: total.innerText, payment_method: optionSelect })
        });
        const json = await response.json();
        if (json.status === 'success') {
            showChange(total.innerText)
            const tbody = document.getElementById('tbodyCart');
            tbody.innerHTML = '';
            total.innerText = 0.00;
            inputSearch.value = '';
            document.getElementById('bodySearch').innerHTML = '';
            Toastify({
                text: json.message,
                duration: 3000
            }).showToast();
        }
        if (json.status === 'error') {
            Toastify({
                text: json.error,
                duration: 3000
            }).showToast();
        }
    }
}


const emptyCart = async (e, cid) => {
    e.preventDefault();
    const response = await fetch(`/api/cart/empty/${cid}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    const data = await response.json();
    if (data.status === 'success') {
        const tbody = document.getElementById('tbodyCart');
        const total = document.getElementById('totalPrice');
        total.innerText = 0.00;
        tbody.innerHTML = '';
        Toastify({
            text: data.message,
            duration: 3000
        }).showToast();
    }
    if (data.status === 'error') {
        Toastify({
            text: data.error,
            duration: 3000
        }).showToast();
    }
}

const createSummaryDay = async (e) => {
    e.preventDefault();
    const input = document.getElementById('startDay');
    const response = await fetch('/api/resume/create/diary', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ initAmount: input.value })
    });
    const json = await response.json();
    if (json.status === 'success') {
        const divStartDay = document.getElementById('btnStartDay');
        const divButtons = document.getElementById('divShowBtnSummary');
        Toastify({
            text: json.message,
            duration: 3000
        }).showToast();
        Swal.close();
        divStartDay.classList.add('hiden');
        divButtons.innerHTML = `<div id="btnEndDay">
        <button onclick="finishDay(event)" class="btn-generate-summary">Terminar el día</button>
    </div>`;
        idResume = json.id;
    }
    if (json.status === 'error') {
        Toastify({
            text: json.error,
            duration: 3000
        }).showToast();
    }
}

const showAlertStartDay = (e) => {
    e.preventDefault();
    Swal.fire({
        title: "<strong>Ingresa el monto de la caja de inicio</strong>",
        html: `
          <div>
            <input id="startDay" type="number" placeholder="Monto">
            <button onclick="createSummaryDay(event)" >Confirmar</button>
          </div>
        `,
        showCloseButton: true,
        showConfirmButton: false
    });
}

const finishDay = async (e, id) => {
    e.preventDefault();
    const idSummary = idResume? idResume : id;
    console.log(idSummary)
    const response = await fetch(`/api/resume/end/${idSummary}`, {
        method: 'PUT',
        credentials: 'include',
    });
    const json = await response.json();
    if (json.status === 'success') {
        const divButtons = document.getElementById('divShowBtnSummary');
        const divFinishDay = document.getElementById('btnEndDay');
        Toastify({
            text: json.message,
            duration: 3000
        }).showToast();
        divFinishDay.classList.add('hiden')
        divButtons.innerHTML = `<div id="btnStartDay">
        <button onclick="showAlertStartDay(event)" class="btn-generate-summary">Empezar el día</button>
    </div>`
    }
    if (json.status === 'error') {
        Toastify({
            text: json.error,
            duration: 3000
        }).showToast()
    }
}

const generateMonthlySummary = async (e) => {
    e.preventDefault();
    const response = await fetch('/api/resume/create/monthly', {
        method: 'POST',
        credentials: 'include'
    });
    const json = await response.json();
    if (json.status === 'success') {
        Toastify({
            text: json.message,
            duration: 3000
        }).showToast()
    }
    if (json.status === 'error') {
        Toastify({
            text: json.error,
            duration: 4000
        }).showToast();
    }
}