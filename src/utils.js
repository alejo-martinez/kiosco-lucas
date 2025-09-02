import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from './config/config.js';


export const cookieExtractor = (req) => {
    let token = null;
    // console.log(req.cookies)
    if (req && req.cookies) {
        token = req.cookies.accesToken
    }
    return token;
}


export const formatDate = (date) => {
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Argentina/Buenos_Aires' // Especifica la zona horaria de Argentina
    };
    return new Date(date).toLocaleDateString('es-AR', options);
};


export const formatDateWithHours = (date) => {
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false, // Mostrar en formato de 24 horas
        timeZone: 'America/Argentina/Buenos_Aires' // Especifica la zona horaria de Argentina
    };
    return new Date(date).toLocaleDateString('es-AR', options);
};

export const generateToken = (user) => {
    const token = jwt.sign({ userId: user._id }, config.jwtSecret, { expiresIn: '30d' });
    return token;
}

export const createHash = (password) => bcrypt.hashSync(password, bcrypt.genSaltSync(10));

export const isValidPassword = (user, password) => {
    return bcrypt.compareSync(password, user.password);
}

export const calculateSellingPrice = (percentage, costPrice) => {
    const result = Number(costPrice) * (1 + Number(percentage) / 100);
    return result.toFixed(2);
}

export const paymentMethod = (method) => {
    if (method === 'eft') return 'Efectivo';
    if (method === 'mp') return 'Mercado Pago';
    if (method === 'td') return 'Tarjeta de débito';
    if (method === 'tc') return 'Tarjeta de crédito';
}

const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

export const returnMonth = (month) => {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[month];
}

export const calcularMasVendidos = (summary) => {
    const contadorProductos = {};

    summary.products.forEach(({ product, quantity }) => {
        const id = product.id;

        if (!contadorProductos[id]) {
            contadorProductos[id] = {
                ...product,
                totalVendida: 0,
            };
        }

        contadorProductos[id].totalVendida += quantity;
    });

    // Convertimos el objeto a array y lo ordenamos de mayor a menor por cantidad vendida
    const productosOrdenados = Object.values(contadorProductos).sort(
        (a, b) => b.totalVendida - a.totalVendida
    );

    // Top 1 más vendido
    const masVendido = productosOrdenados[0];

    return {
        masVendido,
        topVendidos: productosOrdenados.slice(0, 3), // por ejemplo top 5
    };
};
