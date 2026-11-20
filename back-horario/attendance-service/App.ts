import express from 'express'

const app = express()
const PORT = process.env.PORT || 10112

app.use(express.json())

app.get('/', (req, res) => {
    res.send('Attendance Service is running')
})

app.listen(PORT, () => {
    console.log(`Attendance Service is running on port ${PORT}`)
})