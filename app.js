const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const dbpath = path.join(__dirname, 'covid19India.db')

const app = express()

app.use(express.json())

let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()

const convertStatedbobject = newdbObject => {
  return {
    stateId: newdbObject.state_id,
    stateName: newdbObject.state_name,
    population: newdbObject.population,
  }
}

const convertdistrictSbmakeToCAMEL = newdbObject => {
  return {
    districtId: newdbObject.district_id,
    districtName: newdbObject.district_name,
    stateId: newdbObject.state_id,
    cases: newdbObject.cases,
    cured: newdbObject.cured,
    active: newdbObject.active,
    deaths: newdbObject.deaths,
  }
}

app.get('/states/', async (request, response) => {
  const getStateQuety = `
  SELECT
   * 
  FROM 
  state
   ORDER BY  
  state_id;`

  const stateArray = await db.all(getStateQuety)
  response.send(stateArray.map(eachstate => convertStatedbobject(eachstate)))
})

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStatreQuety = `
  SELECT
  *
  FROM
  state
  WHERE

  state_id = ${stateId};`

  const state = await db.get(getStatreQuety)
  response.send(convertStatedbobject(state))
})

app.get(
  '/districts/:districtId/',

  async (request, response) => {
    const {districtId} = request.params
    const getDistrictQuery = `
  SELECT
  *
  FROM
  district
  WHERE
  district_id = ${districtId};`
    const district = await db.get(getDistrictQuery)
    response.send(convertdistrictSbmakeToCAMEL(district))
  },
)

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const postDistrictQuery = `
  INSERT INTO

  district ( district_name , state_id, cases, cured, active, deaths)

  VALUES
  ( '${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`

  await db.run(postDistrictQuery)
  response.send('District Successfully Added')
})

app.delete(
  '/districts/:districtId/',

  async (request, response) => {
    const {districtId} = request.params
    const delereDistricQuery = `
  DELETE FROM
  district
  WHERE 
  district_id = ${districtId};`
    await db.run(delereDistricQuery)
    response.send('District Removed')
  },
)

app.put(
  '/districts/:districtId/',

  async (request, response) => {
    const {districtId} = request.params
    const {districtName, stateId, cases, cured, active, deaths} = request.body
    const updateDiicQuey = `
  UPDATE
  district
  SET
  district_name = '${districtName}',
  state_id = ${stateId},
  cases = ${cases},
  cured = ${cured},
  active = ${active},
  deaths = ${deaths}
  WHERE
   district_id = ${districtId};`

    await db.run(updateDiicQuey)
    response.send('District Details Updated')
  },
)

app.get(
  '/states/:stateId/stats/',

  async (request, response) => {
    const {stateId} = request.params
    const getStatesQuey = `
  SELECT
   SUM(cases) as totalCases ,
   SUM(cured) as totalCured,
   SUM(active) as totalActive,
   SUM(deaths) as totalDeaths

   FROM

   district

   WHERE

   state_id=${stateId};`

    const stats = await db.get(getStatesQuey)
    response.send(stats)
  },
)

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
  select 
  state_id
  from
  district
  where
  district_id = ${districtId};`

  const getDistrictQueryResponse = await db.get(getDistrictQuery)

  const getStateQuery = `
  select
  state_name as stateName from state
  WHERE state_id = ${getDistrictQueryResponse.state_id};`

  const getNmeQueyResponse = await db.get(getStateQuery)
  response.send(getNmeQueyResponse)
})

module.exports = app
