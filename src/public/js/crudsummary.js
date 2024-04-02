const confirmExpense = async(e, id)=>{
    e.preventDefault();
    const expense = document.getElementById('expenseTitle');
    const amount = document.getElementById('expenseAmount');
    const response = await fetch(`/api/resume/add/expense/${id}`, {
        method: "PUT",
        credentials: "include",
        headers:{
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({expense: expense.value, amount: amount.value})
    })
    const json = await response.json();
    if(json.status === 'success'){
        const tbody = document.getElementById('tbodySummary');
        Toastify({
            text: json.message,
            duration: 3000
        }).showToast()
        tbody.innerHTML += `<tr>
        <td>${expense.value}</td>
        <td>$ ${amount.value}</td>
    </tr>`
    }
    if(json.status === 'error'){
        console.log(json.error)
        Toastify({
            text: json.error,
            duration: 4000
        }).showToast();
    }
}

const addExpense = (e, id)=>{
        e.preventDefault();
        Swal.fire({
            title: "<strong>Ingresar expensa</strong>",
            html: `
              <div class="div-input-expenses">
                <input id="expenseTitle" type="text" placeholder="Nombre expensa" name="expense">
                <input id="expenseAmount" type="number" placeholder="Monto expensa" name="amount">
                <button onclick="confirmExpense(event, '${id}')">Agregar</button>
              </div>
            `,
            showCloseButton: true,
            showConfirmButton: false
        });
}