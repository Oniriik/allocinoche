// Imports
const express = require('express');
const axios = require('axios');
// Express setup
const res = require('express/lib/response');
const { redirect } = require('express/lib/response');
const app = express();
app.set('view engine', 'ejs');

app.listen(process.env.PORT ||8080, () => {
    console.log(`\n\n\n\n\n/// RUNNING ///\n`)
  })

app.use('/static', express.static('public'));

app.get('/redirect', (req, res) => {
    messages = [
        "Adding movie...",
    ]
    locations = [
        "/",
    ]
    path = locations[req.query.id]
    msg = messages[req.query.id]
    res.render('redirect',{msg,path})
});


function checkIfInDB(toCheck,moviesList){
    for(const element of moviesList){
        if(element.imdbID == toCheck){
            console.log(element.title , " exist")
            return true
        }
    }
    return false
}

app.get('/search', (req, res) => {
    moviesList = []
    axios.get('https://allocinoche.herokuapp.com/api/movies?sort=id&oder=asc').then(resp => {
            movieQuery = resp['data'].data
            // Format movieQuery for easier usage
            for (let i = 0; i < movieQuery.length; i++) {
                const currentMovie = {
                    'title': movieQuery[i].attributes.title,
                    'imdbID' : movieQuery[i].attributes.imdbID
                }
                moviesList.push(currentMovie)
            }
            const movieToSearch = req.query.movie;
            const options = {
                method: 'GET',
                url: 'https://movie-database-alternative.p.rapidapi.com/',
                params: {s: movieToSearch, r: 'json', page: '1'},
                headers: {
                  'X-RapidAPI-Host': 'movie-database-alternative.p.rapidapi.com',
                  'X-RapidAPI-Key': RAPID_API_TOKEN
                }
              };
              
              axios.request(options).then(function (response) {
                  let foundMovies = []
                  searchQuery = response.data.Search;
                  // Format searchQuery for easier usage
                  for (let i = 0; i < searchQuery.length; i++) {
                      const currentMovie = {
                          'title': searchQuery[i].Title,
                          'release': searchQuery[i].Year,
                          'cover_path': searchQuery[i].Poster == "N/A" ? "/static/assets/blankPoster.png" : searchQuery[i].Poster,
                          'imdbID': searchQuery[i].imdbID,
                          'alreadyInDB' : checkIfInDB(searchQuery[i].imdbID ,moviesList)
                      }
                      foundMovies.push(currentMovie)
                  }
                  console.log(foundMovies[1])
                  res.render('addmovie',{foundMovies});
              }).catch(function (error) {
                  console.error(error);
              });
        });
});

async function addToBDD(toSend){
        let rating  = Math.round(parseInt(toSend.imdbRating)/2)
        axios.post('https://allocinoche.herokuapp.com/api/movies',{
            "data":{
                "title": toSend.Title,
                "release": toSend.Year,
                "plot": toSend.Plot,
                "director": toSend.Director,
                "writter": toSend.Writer,
                "actors": toSend.Actors,
                "rating": rating,
                "cover_path": toSend.Poster == "N/A" ? "/static/assets/blankPoster.png" : toSend.Poster,
                "imdbID": toSend.imdbID
            }
        }).then(resp=>{
            console.log("Added"+ toSend.Title);
          })  
          .catch(error=>{
            console.log(error)
          });
    }

app.get('/addmovie',async(req, res) => {
    const toAdd = req.query.toAdd;
    if(Array.isArray(toAdd) == false){
        const options = {
            method: 'GET',
            url: 'https://movie-database-alternative.p.rapidapi.com/',
            params: {r: 'json', i: toAdd},
            headers: {
              'X-RapidAPI-Host': 'movie-database-alternative.p.rapidapi.com',
              'X-RapidAPI-Key': '2fba6ce8f4msh955533e104418b4p14244bjsn30c181fb15da'
            }
          };
          await axios.request(options).then(function (response) {
                addToBDD(response.data)
          }).catch(function (error) {
                console.error(error);
          })
    }else{
        for (let i = 0; i < toAdd.length; i++) {
            const options = {
                method: 'GET',
                url: 'https://movie-database-alternative.p.rapidapi.com/',
                params: {r: 'json', i: toAdd[i]},
                headers: {
                  'X-RapidAPI-Host': 'movie-database-alternative.p.rapidapi.com',
                  'X-RapidAPI-Key': '2fba6ce8f4msh955533e104418b4p14244bjsn30c181fb15da'
                }
              };
              
              await axios.request(options).then(function (response) {
                addToBDD(response.data)
              }).catch(function (error) {
                    console.error(error);
              });
            }
        }
        res.redirect('/redirect?id=0')
});

app.get('*',(req, res) => {
    let movies = []
    axios.get('https://allocinoche.herokuapp.com/api/movies?sort=id&oder=asc').then(resp => {
            movieQuery = resp['data'].data
            // Format movieQuery for easier usage
            for (let i = 0; i < movieQuery.length; i++) {
                const currentMovie = {
                    'title': movieQuery[i].attributes.title,
                    'plot': movieQuery[i].attributes.plot,
                    'release': movieQuery[i].attributes.release,
                    'rating': movieQuery[i].attributes.rating,
                    'cover_path': movieQuery[i].attributes.cover_path,
                    'director': movieQuery[i].attributes.director,
                    'writter': movieQuery[i].attributes.writter,
                    'actors': movieQuery[i].attributes.actors,
                    'imdbID' : movieQuery[i].attributes.imdbID
                }
                movies.push(currentMovie)
            }
            res.render("mainpage",{movies})
        });

});
