import express from 'express'

const app = express()
const PORT = process.env.PORT || 10113

app.use(express.json())

app.get('/', (req, res)=> {
    res.send('Auth Service is running')
})

app.listen(PORT, () => {
    console.log(`Auth Service is running on port ${PORT}`)
})