const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server is Running at http://localhost:3001/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//1.GET Players from player table API
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
            SELECT 
                * 
            FROM 
                player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  const ans = (dbObject) => {
    return {
      playerId: dbObject.player_id,
      playerName: dbObject.player_name,
    };
  };
  response.send(playersArray.map((eachPlayer) => ans(eachPlayer)));
});

//2.GET player from player Table API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
            SELECT 
                * 
            FROM 
                player_details
            WHERE 
                player_id=${playerId};`;
  const player = await db.get(getPlayerQuery);
  const object = {
    playerId: player.player_id,
    playerName: player.player_name,
  };
  response.send(object);
});

//3.update player API
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
            UPDATE 
                player_details
            SET 
                player_name='${playerName}'
            WHERE 
                 player_id=${playerId};`;
  /* const updatePlayer =*/ await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//4.GET match details API
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
                SELECT 
                    * 
                FROM 
                    match_details 
                WHERE 
                    match_id=${matchId};`;
  const match = await db.get(getMatchQuery);
  const object = {
    matchId: match.match_id,
    match: match.match,
    year: match.year,
  };
  response.send(object);
});

//5.GET all matches of player
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
                SELECT 
                    match_details.match_id,
                    match_details.match,
                    match_details.year
                FROM 
                    match_details NATURAL JOIN player_match_score
                WHERE 
                    player_id=${playerId};`;

  const matchesPlayed = await db.all(getPlayerMatchesQuery);
  const ans = (dbObject) => {
    return {
      matchId: dbObject.match_id,
      match: dbObject.match,
      year: dbObject.year,
    };
  };
  response.send(matchesPlayed.map((eachPlayed) => ans(eachPlayed)));
});

//6.list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getQuery = `
                SELECT 
                    player_details.player_id,
                    player_details.player_name
                FROM 
                    player_details NATURAL JOIN player_match_score 
                WHERE 
                    match_id=${matchId};`;
  const playerResult = await db.all(getQuery);
  const ans = (dbObject) => {
    return {
      playerId: dbObject.player_id,
      playerName: dbObject.player_name,
    };
  };
  response.send(playerResult.map((eachPlayer) => ans(eachPlayer)));
});

//7. statistics of total score,four,sixes of specific plyerID
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatsQuery = `
            SELECT 
                player_details.player_id as playerId,
                player_details.player_name as playerName,
                SUM(score) as totalScore,
                SUM(fours) as totalFours,
                SUM(sixes) as totalSixes
            FROM 
                 player_details NATURAL JOIN player_match_score 
            WHERE 
                player_id=${playerId};`;
  const stats = await db.get(getStatsQuery);
  response.send(stats);
});

module.exports = app;
