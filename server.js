import { createRequire } from "module";
const require = createRequire(import.meta.url);

const http = require("http");
const { PassThrough } = require("stream");
const app = require("express")();
import fetch from "node-fetch";
app.get("/", (req,res)=> res.sendFile(__dirname + "/index.html"))
app.listen(9091, ()=>console.log("Listening to port 9091"))
const websocketServer = require("websocket").server
const httpServer = http.createServer();
httpServer.listen(9090, ()=> console.log("Listening.. on 9090"))

const clients = {};
const games = {};

//read from file a list of words, save it in a list and and shuffle it (twice for good measure)
async function getWords() {
    var response = await fetch('https://www.mit.edu/~ecprice/wordlist.10000');
    var openedText = await response.text(); // <-- changed
    var words = openedText.split(/\r\n|\n/);
    return words;
}

var words = getWords();
console.log(words)

function allAnagrams(word) {
    
    var anaWord = word;
    
    var all = [];
    for(var i = 0; i < words.length; i++) {

        var currentWord = words[i];
        anaWord = word;
        
        if(currentWord.length <= anaWord.length) {
            var isAnagram = true;
            for(var k = 0; k < currentWord.length; k++) {
                var current = currentWord.substring(k, k+1);
                var indOf = anaWord.indexOf(current);
                
                
                if(indOf > -1) {
                    anaWord = anaWord.split("");
                    anaWord.splice(indOf, 1);
                    anaWord = anaWord.join('');
                } else {
                    isAnagram = false;
                }
            }
                
            if (isAnagram) {
                all.push(currentWord);
            }
        }
    }
    return all;
}

// console.log(allAnagrams('tab'))
allAnagrams('abcdefg');
const wsServer = new websocketServer({
    "httpServer": httpServer
})
wsServer.on("request", request => {

    const connection = request.accept(null, request.origin);
    connection.on("open", ()=> {
    
    })

    connection.on("close", ()=> console.log("closed!"))
    connection.on("message", message => {
        const result = JSON.parse(message.utf8Data)
        if (result.method === "create") {
            const clientId = result.clientId;
            const gameId = guid();
            games[gameId] = {
                "id": "gameId",
                "clients": []
            }

            const payload = {
                "method": "create",
                "game": games[gameId]
            }

            const con = clients[clientId].connection;
            con.send(JSON.stringify(payload))
        }
        if (result.method === "join") {
            const clientId = result.clientId;
            const gameId = result.gameId;
            const game = games[gameId];
            const color =  {"0": "Red", "1": "Green", "2": "Blue"}[game.clients.length]

            game.clients.push({
                "clientId": clientId,
                "word": "word"
            })
        }
    })

    const clientId = guid();
    clients[clientId] = {
        "connection": connection
    }

    const payload = {
        "method": "connect",
        "clientId": clientId
    }

    connection.send(JSON.stringify(payload))
})

function S4(){
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}

function guid() {
    return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
}
