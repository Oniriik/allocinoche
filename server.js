const express = require('express');
const axios = require('axios');
const res = require('express/lib/response');
const app = express();


// set EJS as templating engine
app.set('view engine', 'ejs');

app.listen(process.env.PORT ||8080);


// Take actors array and format [name lastname, etc]
function actorsAssemble(actors){
    const actorsList = []
    for (let j = 0; j < actors.length; j++) {
        actorsList.push(actors[j].attributes.name +" "+actors[j].attributes.lastname)
    }
    return actorsList
}


// give access to 'public' folder from '/static' url's pathname
app.use('/static', express.static('public'));


app.get('/dashboard', (req, res) => {
    res.render('dashboard')
});

app.get('/redirect', (req, res) => {
    messages = [
        "Adding movie...",
    ]
    locations = [
        "/",
    ]
    path = locations[req.query.id]
    msg = messages[req.query.id]
    console.log(path,msg)
    res.render('redirect',{msg,path})
});
async function addToBDD(toSend){
    await axios.get('https://allocinoche.herokuapp.com/api/movies?filters[imdbID][$eq]='+toSend.imdbID).then(resp => {
    if(resp['data'].data.length == 0){
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
                "cover_path": toSend.Poster,
                "imdbID": toSend.imdbID
            }
        }).then(resp=>{
            console.log("Added"+ toSend.Title);
          })  
          .catch(error=>{
            console.log(error)
          });
        }else{
            console.log("already in db")    
        }
        
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


app.get('/search', (req, res) => {
    const movieToSearch = req.query.movie;
    
    const options = {
        method: 'GET',
        url: 'https://movie-database-alternative.p.rapidapi.com/',
        params: {s: movieToSearch, r: 'json', page: '1'},
        headers: {
          'X-RapidAPI-Host': 'movie-database-alternative.p.rapidapi.com',
          'X-RapidAPI-Key': '2fba6ce8f4msh955533e104418b4p14244bjsn30c181fb15da'
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
                  'cover_path': searchQuery[i].Poster,
                  'imdbID': searchQuery[i].imdbID
              }
              foundMovies.push(currentMovie)
          }
          res.render('addmovie',{foundMovies});
      }).catch(function (error) {
          console.error(error);
      });
    
});
app.get('/', async (req, res) => {
    // Fetch movies from API then render page
    console.log("/")
    let movies = []
    await axios.get('https://allocinoche.herokuapp.com/api/movies?sort=id&oder=asc').then(resp => {
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
                'actors': movieQuery[i].attributes.actors
            }
            movies.push(currentMovie)
        }
    });
    res.render('mainpage',{movies})
});
