// import { io } from "./app.js";
// import CartManager from "./dao/service/cart.service.js";
// import ProductManager from "./dao/service/product.service.js";


// io.on('connection', async (socket) => {

//     socket.on('searchCodeUpdate', async (data) => {
//         try {
//             const prodManager = new ProductManager(socket.data.db)
//             const prod = await prodManager.getBy('code', Number(data.code));
//             if (!prod) throw new CustomError('No data', 'No se encontró un producto', 4);
//             io.to(data.socketId).emit('resultCodeUpdate', { producto: prod });
//         } catch (error) {
//             console.log(error)
//             io.to(data.socketId).emit('errorCodeUpdate', { error: error.message })
//         }
//     })

//     socket.on('searchCode', async (data) => {
//         try {
//             console.log(data)
//             const prodManager = new ProductManager(socket.data.db)
//             const prod = await prodManager.getBy('code', Number(data.query));

//             io.to(data.socketId).emit('resultCode', { producto: prod });
//         } catch (error) {
//             console.log(error)
//             io.to(data.socketId).emit('errorCode', { error: error.message })
//         }

//     })

//     socket.on('search', async (data) => {
//         try {
//             const prodManager = new ProductManager(socket.data.db)
//             const cartManager = new CartManager(socket.data.db);
//             const prod = await prodManager.getBy('code', Number(data.query));
//             if (!prod) throw new CustomError('No data', 'El producto no existe', 4);

//             if (prod.stock <= 0) throw new CustomError('No stock', 'Producto sin stock', 4);
//             const carrito = await cartManager.getCartById(data.cid);

//             const finded = carrito.products.find(p => p.product._id.equals(prod._id));

//             if ((finded && ((Number(finded.quantity) + Number(data.quantity) > prod.stock))) || (Number(data.quantity) > prod.stock)) throw new CustomError('No stock', 'Alcanzaste el máximo de stock de este producto', 6)
//             const totalPrice = Number(prod.sellingPrice) * Number(data.quantity);
//             const cart = await cartManager.addProduct(data.cid, prod._id, data.quantity, totalPrice, prod.stock);
//             let total = 0;
//             cart.products.forEach(prod => {
//                 total += Number(prod.totalPrice);
//             });
//             total = Number(total).toFixed(2);
//             io.to(data.socketId).emit('updatedCart', { cart: cart, total: total });

//         } catch (error) {
//             console.log(error)
//             socket.to(data.socketId).emit('errorUpdate', { error: error.message })
//         }
//     })

//     socket.on('searchByCode', async (data) => {
//         try {
//             const prodManager = new ProductManager(socket.data.db)
//             const prod = await prodManager.getBy('code', Number(data.code));
//             if (!prod) throw new CustomError('No data', 'El producto no existe', 4);
//             io.to(data.socketId).emit('resultTitle', { results: [prod] });
//         } catch (error) {
//             socket.emit('errorUpdate', { error: error.message });
//         }
//     })

//     socket.on('searchTitle', async (data) => {
//         const prodManager = new ProductManager(socket.data.db)
//         const products = await prodManager.getSearch();
//         if (!data.query) io.emit('result', { empty: true });
//         else {
//             const prodsFilter = products.filter((prod) => prod.title.toLowerCase().includes(data.query.toLowerCase()));
//             io.to(data.socketId).emit('resultTitle', { results: prodsFilter });
//         }
//     })

//     // socket.on('searchAndUpdate', async(data)=>{

//     // })

//     socket.on('addToCart', async (data) => {
//         // console.log(data)
//         try {
//             const cartManager = new CartManager(socket.data.db);
//             const prodManager = new ProductManager(socket.data.db)
//             const producto = await prodManager.getById(data.pid);
//             const totalPrice = producto.sellingPrice * data.quantity;
//             const cart = await cartManager.addProduct(data.cid, data.pid, data.quantity, totalPrice);
//             let total = 0;
//             cart.products.forEach(prod => total += prod.totalPrice);
//             io.emit('updatedCart', { cart: cart, total: total });
//         } catch (error) {
//             console.log(error);
//             socket.emit('errorUpdate', error)
//         }
//     })

//     socket.on('remove', async (data) => {
//         try {
//             const cartManager = new CartManager(socket.data.db);
//             const cartUpdated = await cartManager.removeProduct(data.cid, data.pid);
//             let total = 0;
//             cartUpdated.products.forEach(prod => total += prod.totalPrice);
//             io.emit('removeSuccess', { cart: cartUpdated, total: total });
//         } catch (error) {

//             socket.emit('removeError', error);
//         }
//     })
// })