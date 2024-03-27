const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
const bcrypt = require('bcrypt')
app.use(express.json())

const dbPath = path.join(__dirname, 'userData.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

app.post('/register', async (request, response) => {
  let {username, name, password, gender, location} = request.body //Destructuring the data from the API call

  let hashedPassword = await bcrypt.hash(password, 10) //Hashing the given password

  let checkTheUsername = `SELECT * FROM user WHERE username = '${username}';`
  let userData = await db.get(checkTheUsername)
  if (userData === undefined) {
    let postNewUserQuery = `
            INSERT INTO
            user (username,name,password,gender,location)
            VALUES (
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            );`
    if (password.length < 5) {
      //checking the length of the password
      response.status(400)
      response.send('Password is too short')
    } else {
      let newUserDetails = await db.run(postNewUserQuery)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const Query1 = `select * from user where username='${username}';`
  const dbuser = await db.get(Query1)
  if ((dbuser == undefined)) {
    response.status = 400
    response.send('Invalid user')
  } else {
    const checkpass = await bcrypt.compare(password, dbuser.password)
    if (checkpass == false) {
      response.status = 400
      response.send('Invalid password')
    } else {
      response.status = 200
      response.send('Login success!')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const Query1 = `select * from user where username='${username}';`
  const dbuser = await db.get(Query1)
  if (dbuser == undefined) {
    response.status = 400
    response.send('User not registered')
  } else {
    const currentPassword = await bcrypt.compare(oldPassword, dbuser.password)
    if (currentPassword) {
      if (newPassword.length < 5) {
        response.status = 400
        response.send('Password is too short')
      } else {
        const encryptpass = await bcrypt.hash(newPassword, 10)
        const Query2 = `
      update user
      set password='${encryptpass}'
      where username='${username}';`
        await db.run(Query2)
        response.send('Password updated')
      }
    } else {
      response.status = 400
      response.send('Invalid current password')
    }
  }
})

module.exports = app
