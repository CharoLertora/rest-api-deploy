// primero instalarlo con el comando  npm install express -E
const express = require('express') // require -> commonJS
const movies = require('./movies.json')
const crypto = require('node:crypto') // NodeJS tiene una biblioteca nativa que te permite crear IDs únicas.
const { validateMovie, validatePartialMovie } = require('./schemas/movies.js')
const cors = require('cors')

const app = express()
app.disable('x-powered-by')
app.use(express.json())
app.use(cors({
    origin: (origin, callback) => {
        const ACCEPTED_ORIGINS = [
            'http://localhost:8080',
            'http://localhost:1234',
            'https://movies.com',
            'https://midu.dev'
        ]

        if (ACCEPTED_ORIGINS.includes(origin)) {
            return callback(null, true)
        }

        if (!origin) {
            return callback(null, true)
        }

        return callback(new Error('Not allowed by CORS'))
    }
}))

// métodos normales: GET/HEAD/POST
// métodos complejos: PUT/PATCH/DELETE

// CORS PRE-Flight
// OPTIONS

// Todos los recursos que sean MOVIES se identifica con /movies

// NOTA: recordar que todo lo que tenga filtro tiene que ir antes de la consulta general que trae todas las movies porque sino, se ejecuta la otra consulta.
app.get('/movies', (req, res) => {
    const { genre } = req.query
    if (genre) {
        const filteredMovies = movies.filter(
            movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
        )
        return res.json(filteredMovies)
    }
    res.json(movies)
})

// Todos los recursos que sean MOVIES se identifican con /movies
app.get('/movies', (req, res) => {
    res.json(movies)
})

// path-to-regexp -> es una biblioteca que te convierte path complejas en expresiones regulares. Viene ya incluída en node y tiene significancia para muchas cosas, por ejemplo para el ?, para el +, para muchas cosas.
app.get('/movies/:id', (req, res) => {
    const { id } = req.params
    const movie = movies.find(movie => movie.id === id)

    if (movie) return res.json(movie)

    res.status(404).json({ message: 'Movie not found ' })
})


// Vamos a hacer validaciones, para eso usamos zod y la instalamos con el comando: (tambien sirve para validar formularios)
// npm install zod -E -> recordar que -E es para descargar la dependencia exacta y que no se ponga el sombrerito
app.post('/movies', (req, res) => {
    // para hacer esto y no extraer todos los datos a mano, hay que usar el middlewear de express para extraer el json que lo pusimos arriba.
    const result = validateMovie(req.body)

    if (result.error) {
        return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    const newMovie = {
        id: crypto.randomUUID(),
        ...result.data
    }
    // ]Esto no sería REST, porque estamos guardando el estado de la app en memoria. La semana que viene lo usamos con bdd
    movies.push(newMovie)

    res.status(201).json(newMovie) // a veces es interesante devolver el recurso creado para actualizar la caché del cliente
})

app.delete('/movies/:id', (req, res) => {
    const { id } = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)

    if (movieIndex === -1) {
        return res.status(404).json({ message: 'Movie not found' })
    }

    movies.splice(movieIndex, 1)

    return res.json({ message: 'Movie Deleted' })
})

app.patch('/movies/:id', (req, res) => {
    const result = validatePartialMovie(req.body)

    if (!result.success) {
        return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    const { id } = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)

    if (movieIndex === -1) {
        return res.status(404).json({ message: 'Movie not found' })
    }

    const updateMovie = {
        ...movies[movieIndex],
        ...result.data
    }

    movies[movieIndex] = updateMovie
    return res.json(updateMovie)
})

const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
    console.log('server listening on port http://localhost:${PORT}')
})
