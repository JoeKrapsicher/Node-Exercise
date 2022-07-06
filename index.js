const app = require('express')();
const bodyParser = require('body-parser');
const axios = require('axios');
const Promise = require("bluebird");
app.use(bodyParser.json());

let nextPlanetsPageUrl = 'http://swapi.dev/api/planets?page=1'
let nextPeoplePageUrl = 'http://swapi.dev/api/people/?page=1';
let planetsList = [];
let peopleList = [];

const getAllPlanets = async() => {
    try {
        const allPlanets = await axios.get(nextPlanetsPageUrl)
        let {next, results} = allPlanets.data
        nextPlanetsPageUrl = next;
        planetsList = planetsList.concat(results)
    }
    catch(err) {
        console.log('req planets err', err)
    }
}

const getResidentsName = async (residentLinksArr) => {
    const allNames = residentLinksArr.map(everyResidentLink => axios.get(everyResidentLink));
    
    return axios.all(allNames).then(
        axios.spread((...responses) => {
            return responses.map(residentInfo => residentInfo.data.name)
        })
        )
    }
    
    app.get('/planets/', async (req,res) => {
        await getAllPlanets();
        while (typeof nextPlanetsPageUrl === 'string') {
            await getAllPlanets();
        }
        if (planetsList.length > 0) {
            const changePlanets = (planetsList) => {
            return Promise.all(
                planetsList.map( async (planetData) => {
                    planetData.residents = await getResidentsName(planetData.residents);
                    return planetData
                })
                )
            }
            
            changePlanets(planetsList)
            .then((changedPlanets) => {
                res.status(200).json(changedPlanets)
            })
        }
        else{ 
            res.status(404).json('Failed to get planets')
        }
        
    })


    const getAllPeople = async() => {
        try {
            const allPeople = await axios.get(nextPeoplePageUrl);
            let {next, results} = allPeople.data
            nextPeoplePageUrl = next;
            peopleList = peopleList.concat(results)
        }
        catch(err) {
            console.log('request people error:', err)
        }
    };
    
    app.get('/people/', async (req, res) => {
        let sortBy = req.query.sortBy;
        await getAllPeople();
        while (typeof nextPeoplePageUrl  === 'string') {
            await getAllPeople();
        }
        if (sortBy !== undefined && peopleList.length > 0) {
            peopleList.sort((a,b) => a[sortBy] - b[sortBy]);
        }
        if (peopleList.length > 0) {
            res.status(200).json(peopleList);
        } else {
            res.status(404).json('Failed to get people list');
        }
    })
    
    //node server is listening on port 3000
    app.listen(3000, () => console.log('App is up and running on port 3000!'))