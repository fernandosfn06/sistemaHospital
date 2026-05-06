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


// --- HU8 BE: ENDPOINT DETALLE DE PACIENTE ---
// El ':id' es un parámetro dinámico. Express lo captura automáticamente.
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


// Encender el servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});