const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();


app.use(cors()); 
app.use(express.json()); 

// Configuración de la conexión a la base de datos MySQL local

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',     
    password: 'mysql123',
    port: 3306,      
    database: 'sg_hospitales'
});

db.connect((err) => {
    if (err) throw err;
    console.log('✅ Conectado exitosamente a la base de datos MySQL');
});

// --- HU1 BE: ENDPOINT DE REGISTRO DE PACIENTE ---
app.post('/api/pacientes/registro', async (req, res) => {
    // 1. Extraemos los datos que envía el frontend
    const { email, password, nombre, apellidos, fecha_nacimiento, telefono } = req.body;

    try {
        // 2. Hashing: Encriptamos la contraseña usando bcrypt
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // 3. Guardamos primero en la tabla 'usuarios'
        const queryUsuario = 'INSERT INTO usuarios (email, password_hash) VALUES (?, ?)';
        
        db.query(queryUsuario, [email, password_hash], (err, resultUsuario) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al registrar credenciales' });
            }

            // 4. Obtenemos el ID que MySQL le asignó a este nuevo usuario
            const usuario_id = resultUsuario.insertId;

            // 5. Guardamos en la tabla 'pacientes' vinculando el usuario_id
            const queryPaciente = 'INSERT INTO pacientes (usuario_id, nombre, apellidos, fecha_nacimiento, telefono) VALUES (?, ?, ?, ?, ?)';
            
            db.query(queryPaciente, [usuario_id, nombre, apellidos, fecha_nacimiento, telefono], (err2, resultPaciente) => {
                if (err2) {
                    console.error(err2);
                    return res.status(500).json({ error: 'Error al guardar los datos personales del paciente' });
                }

                res.status(201).json({ mensaje: 'Paciente registrado correctamente con contraseña encriptada' });
            });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// --- HU7 BE: ENDPOINT LISTAR PACIENTES (CON PAGINACIÓN Y FILTROS) ---
app.get('/api/pacientes', (req, res) => {
    const page = parseInt(req.query.page) || 1;      
    const limit = parseInt(req.query.limit) || 10;   
    const search = req.query.search || '';           

    const offset = (page - 1) * limit;

    let queryListar = `
        SELECT p.id, p.nombre, p.apellidos, p.fecha_nacimiento, p.telefono, u.email 
        FROM pacientes p
        INNER JOIN usuarios u ON p.usuario_id = u.id
    `;

    let queryParams = []; 

   
    if (search) {
        queryListar += ` WHERE p.nombre LIKE ? OR p.apellidos LIKE ?`;
       
        queryParams.push(`%${search}%`, `%${search}%`);
    }

    // 5. Instrucciones de paginación
    queryListar += ` LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

   
    db.query(queryListar, queryParams, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al obtener la lista de pacientes' });
        }

      
        res.status(200).json({
            pagina_actual: page,
            resultados_por_pagina: limit,
            total_devueltos: results.length,
            pacientes: results
        });
    });
});


// --- HU8 BE: ENDPOINT DETALLE DE PACIENTE ---

app.get('/api/pacientes/:id', (req, res) => {
    // 1. Extraemos el ID que el frontend puso en la URL
    const pacienteId = req.params.id;

    // 2. Preparamos la consulta SQL. 
    // Usamos INNER JOIN para unir la tabla 'pacientes' con 'usuarios' y traer el email también.
    const queryDetalle = `
        SELECT p.id, p.nombre, p.apellidos, p.fecha_nacimiento, p.telefono, u.email 
        FROM pacientes p
        INNER JOIN usuarios u ON p.usuario_id = u.id
        WHERE p.id = ?
    `;

    // 3. Ejecutamos la consulta
    db.query(queryDetalle, [pacienteId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error interno al buscar los datos del paciente' });
        }

        // 4. Verificamos si MySQL encontró a un paciente con ese ID
        if (result.length === 0) {
            return res.status(404).json({ mensaje: 'Paciente no encontrado en el sistema' });
        }

        // 5. Si todo sale bien, enviamos los datos completos al frontend
        // Usamos result[0] porque sabemos que la búsqueda solo devolverá a una persona
        res.status(200).json(result[0]); 
    });
});


// --- HU9 BE: ENDPOINT ACTUALIZAR PACIENTE ---
// Usamos PUT porque vamos a sobreescribir datos existentes
app.put('/api/pacientes/:id', (req, res) => {
    const pacienteId = req.params.id;
    
    // Extraemos los datos que nos envía el frontend para actualizar
    const { nombre, apellidos, fecha_nacimiento, telefono } = req.body;

    // --- 1. VALIDACIONES ---
    // A. Validar que no falte ningún campo
    if (!nombre || !apellidos || !fecha_nacimiento || !telefono) {
        return res.status(400).json({ 
            error: 'Faltan datos. Todos los campos (nombre, apellidos, fecha_nacimiento, telefono) son obligatorios.' 
        });
    }

    // B. Validar longitud del teléfono 
    if (telefono.length !== 10) {
        return res.status(400).json({ 
            error: 'Formato inválido. El número de teléfono debe tener exactamente 10 dígitos.' 
        });
    }

    // --- 2. CONSULTA SQL ---
    // Usamos UPDATE para cambiar los valores solo del paciente que coincida con el ID
    const queryUpdate = `
        UPDATE pacientes 
        SET nombre = ?, apellidos = ?, fecha_nacimiento = ?, telefono = ?
        WHERE id = ?
    `;

    // --- 3. EJECUTAR ACTUALIZACIÓN ---
    db.query(queryUpdate, [nombre, apellidos, fecha_nacimiento, telefono, pacienteId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error interno al intentar actualizar los datos' });
        }

        // 4. Verificamos si MySQL realmente encontró y modificó una fila
       
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'No se pudo actualizar: Paciente no encontrado' });
        }

        // 5. Respuesta 
        res.status(200).json({ mensaje: 'Datos del paciente actualizados exitosamente' });
    });
});

// Encender el servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});